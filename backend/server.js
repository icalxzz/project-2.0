// server.js
import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import dotenv from "dotenv";
import fs from "fs";
import fetch from "node-fetch"; // node v18+ punya fetch builtin, tapi include for compatibility

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ------------------- Load Service Account -------------------
if (!process.env.FIREBASE_KEY_PATH) {
  console.error("FIREBASE_KEY_PATH not set in .env");
  process.exit(1);
}

const serviceAccount = JSON.parse(
  fs.readFileSync(process.env.FIREBASE_KEY_PATH, "utf-8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DB_URL || undefined,
});

const db = admin.firestore();

// ------------------- Helpers / Middleware -------------------

// Auth middleware: verifikasi Firebase ID token dari Authorization: Bearer <idToken>
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
  if (!token) return res.status(401).json({ error: "Token tidak ditemukan" });

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.auth = decoded; // contains uid, email, etc.
    next();
  } catch (err) {
    console.error("verifyIdToken error:", err);
    return res.status(401).json({ error: "Token tidak valid" });
  }
};

// Admin-only: cek role di Firestore berdasarkan uid dari token
const adminOnly = async (req, res, next) => {
  try {
    const uid = req.auth?.uid;
    if (!uid) return res.status(401).json({ error: "Unauthorized" });

    const docSnap = await db.collection("users").doc(uid).get();
    const profile = docSnap.exists ? docSnap.data() : null;
    if (!profile || profile.role !== "admin") {
      return res.status(403).json({ error: "Hanya admin yang boleh mengakses" });
    }
    next();
  } catch (err) {
    console.error("adminOnly error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ------------------- Routes -------------------

// Health
app.get("/", (req, res) => res.json({ ok: true, env: process.env.NODE_ENV || "dev" }));

/**
 * GET /users
 * - Protected: only admin
 * - Returns all user profiles from Firestore (doc id = uid)
 */
app.get("/users", authMiddleware, adminOnly, async (req, res) => {
  try {
    const snapshot = await db.collection("users").get();
    const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(users);
  } catch (err) {
    console.error("/users error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /users/:uid
 * - Protected: user themself or admin
 */
app.get("/users/:uid", authMiddleware, async (req, res) => {
  try {
    const { uid } = req.params;
    // allow owner or admin
    if (req.auth.uid !== uid) {
      // check admin
      const requester = await db.collection("users").doc(req.auth.uid).get();
      if (!requester.exists || requester.data().role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
      }
    }

    const docSnap = await db.collection("users").doc(uid).get();
    if (!docSnap.exists) return res.status(404).json({ error: "User not found" });
    res.json({ id: docSnap.id, ...docSnap.data() });
  } catch (err) {
    console.error("GET /users/:uid error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /users
 * - Create a user in Firebase Auth (Admin SDK) then create Firestore doc users/{uid}
 * - Protected: adminOnly (only admin can create new users via backend)
 * - Request body: { name, email, password, role }
 */
app.post("/users", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: "email & password required" });

    // create in Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name || "",
    });

    // create profile in Firestore (no password stored)
    const profile = {
      name: name || "",
      email,
      role: role || "user",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("users").doc(userRecord.uid).set(profile);

    res.status(201).json({ uid: userRecord.uid, ...profile });
  } catch (err) {
    console.error("POST /users error:", err);
    if (err.code === "auth/email-already-exists" || err?.message?.includes("already exists")) {
      return res.status(409).json({ error: "Email sudah terdaftar" });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /users/:uid
 * - Update profile (role, name) in Firestore
 * - Protected: adminOnly (only admin can change role)
 * - Body: { role, name }
 */
app.put("/users/:uid", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { uid } = req.params;
    const { role, name } = req.body;
    const update = {};
    if (role) update.role = role;
    if (name) update.name = name;
    if (Object.keys(update).length === 0) return res.status(400).json({ error: "Nothing to update" });

    update.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    await db.collection("users").doc(uid).set(update, { merge: true });

    res.json({ id: uid, ...update });
  } catch (err) {
    console.error("PUT /users/:uid error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /users/:uid
 * - Delete user from Auth (admin.auth().deleteUser) and Firestore
 * - Protected: adminOnly
 */
app.delete("/users/:uid", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { uid } = req.params;

    // Delete from Auth (ignore not-found)
    try {
      await admin.auth().deleteUser(uid);
    } catch (err) {
      if (err.code !== "auth/user-not-found") {
        throw err;
      }
    }

    // Delete Firestore doc
    await db.collection("users").doc(uid).delete();

    res.json({ message: "User deleted from Auth & Firestore", id: uid });
  } catch (err) {
    console.error("DELETE /users/:uid error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /login
 * - Use Firebase Auth REST API to sign in with email/password
 * - On success, read profile from Firestore (users/{uid}) and return idToken + profile
 * - Public (no auth middleware)
 * - Body: { email, password }
 */
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "email & password required" });

    const apiKey = process.env.FIREBASE_WEB_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "FIREBASE_WEB_API_KEY not set" });

    const resp = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    );

    const authData = await resp.json();
    if (!resp.ok) {
      const msg = authData?.error?.message || "Login failed";
      // Normalize common messages
      const friendly = msg === "EMAIL_NOT_FOUND" ? "Email tidak ditemukan" : msg === "INVALID_PASSWORD" ? "Password salah" : msg;
      return res.status(401).json({ error: friendly });
    }

    const uid = authData.localId;
    // ensure profile exists; don't store password
    const docSnap = await db.collection("users").doc(uid).get();
    if (!docSnap.exists) {
      // Optionally create a minimal profile
      await db.collection("users").doc(uid).set({
        email,
        role: "user",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    const profile = (await db.collection("users").doc(uid).get()).data();

    res.json({
      user: {
        id: uid,
        name: profile?.name || authData.displayName || "",
        email,
        role: profile?.role || "user",
      },
      idToken: authData.idToken,
      refreshToken: authData.refreshToken,
      expiresIn: authData.expiresIn,
    });
  } catch (err) {
    console.error("POST /login error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ------------------- Start server -------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
