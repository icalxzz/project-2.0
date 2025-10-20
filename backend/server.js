// ==========================================================
// ✅ server.js — Gabungan penuh CRUD User + Proteksi Edit Siswa
// ==========================================================
import express from "express";
import mysql from "mysql2";
import cors from "cors";
import admin from "firebase-admin";
import fs from "fs";

// ==========================================================
// 🔹 Init Firebase Admin pakai service account
// ==========================================================
const serviceAccount = JSON.parse(
  fs.readFileSync("./serviceAccountKey.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const firestore = admin.firestore();

// ==========================================================
// 🔹 Init Express
// ==========================================================
const app = express();
app.use(cors());
app.use(express.json());

// ==========================================================
// 🔹 MySQL connection
// ==========================================================
const db = mysql.createConnection({
  host: "localhost",
  user: "root",       // sesuaikan
  password: "",       // sesuaikan
  database: "absensi" // sesuaikan
});

db.connect((err) => {
  if (err) {
    console.error("❌ MySQL connection failed:", err);
  } else {
    console.log("✅ Connected to MySQL");
  }
});

// ==========================================================
// 🔹 Helper: mapping snake_case → camelCase
// ==========================================================
function mapUser(user) {
  return {
    id: user.id,
    uid: user.uid,
    email: user.email,
    role: user.role,
    siswaId: user.siswa_id,
    createdAt: user.created_at,
  };
}

// ==========================================================
// 🔹 Middleware: Verifikasi Token Firebase
// ==========================================================
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token tidak ditemukan" });
  }

  const idToken = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (err) {
    console.error("❌ Token invalid:", err);
    res.status(401).json({ error: "Token tidak valid" });
  }
};

// ==========================================================
// 🔹 Middleware: Cek admin
// ==========================================================
const isAdmin = async (req, res, next) => {
  const { uid } = req.user;
  const [rows] = await db
    .promise()
    .query("SELECT role FROM users WHERE uid = ?", [uid]);

  if (rows.length === 0)
    return res.status(403).json({ error: "User tidak ditemukan di DB" });
  if (rows[0].role !== "admin")
    return res.status(403).json({ error: "Hanya admin yang bisa mengakses" });

  next();
};

// ==========================================================
// 🔹 Middleware: Hanya admin atau user dengan siswa_id sesuai yang bisa edit
// ==========================================================
const canEditSiswa = async (req, res, next) => {
  try {
    const { id } = req.params; // id siswa di URL
    const requesterUid = req.user.uid;

    // ambil data user dari MySQL
    const [rows] = await db
      .promise()
      .query("SELECT role, siswa_id FROM users WHERE uid = ?", [requesterUid]);

    if (rows.length === 0)
      return res.status(403).json({ error: "User tidak ditemukan" });

    const { role, siswa_id } = rows[0];

    // admin boleh edit siapa saja
    if (role === "admin") return next();

    // siswa hanya boleh edit datanya sendiri
    if (String(siswa_id) !== String(id)) {
      return res
        .status(403)
        .json({ error: "Akses ditolak: tidak dapat mengedit data siswa lain" });
    }

    next();
  } catch (err) {
    console.error("❌ Error in canEditSiswa:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ==========================================================
// 🔹 API ROUTES CRUD USER (MySQL + Firebase)
// ==========================================================

// 🔹 Get siswaId berdasarkan uid
app.get("/user/:uid", async (req, res) => {
  try {
    const [rows] = await db
      .promise()
      .query("SELECT siswa_id FROM users WHERE uid = ?", [req.params.uid]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "User tidak ditemukan" });
    }

    res.json({ siswaId: rows[0].siswa_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// 🔹 Get user lengkap berdasarkan UID
app.get("/users/:uid", async (req, res) => {
  try {
    const [rows] = await db
      .promise()
      .query("SELECT * FROM users WHERE uid = ?", [req.params.uid]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "User tidak ditemukan" });
    }

    res.json(mapUser(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// 🔹 Get all users
app.get("/users", async (req, res) => {
  try {
    const [rows] = await db.promise().query("SELECT * FROM users");
    res.json(rows.map(mapUser));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Create new user (Firebase + MySQL)
app.post("/users", async (req, res) => {
  const { uid, email, password, role, siswaId } = req.body;

  console.log("📥 Data diterima dari frontend:", req.body);

  if (!email || !role || !siswaId) {
    return res.status(400).json({
      error: "email, role, dan siswaId wajib diisi (password jika create baru)",
    });
  }

  try {
    let finalUid = uid;

    // 🔹 Kalau tidak ada uid, buat user baru di Firebase
    if (!finalUid) {
      if (!password) {
        return res
          .status(400)
          .json({ error: "Password wajib jika membuat user baru" });
      }

      const userRecord = await admin.auth().createUser({ email, password });
      finalUid = userRecord.uid;
      console.log("✅ User baru dibuat di Firebase:", finalUid);
    }

    // 🔹 Insert ke MySQL
    const sql = `
      INSERT INTO users (uid, email, role, siswa_id, created_at) 
      VALUES (?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE email = VALUES(email), role = VALUES(role), siswa_id = VALUES(siswa_id)
    `;

    db.query(sql, [finalUid, email, role, siswaId], (err, result) => {
      if (err) {
        console.error("❌ MySQL insert failed:", err.message);
        return res.status(500).json({ error: err.message });
      }
      console.log("✅ MySQL insert success:", result);
      return res.json({
        message: "✅ User tersimpan di Firebase & MySQL",
        uid: finalUid,
        email,
        role,
        siswaId,
      });
    });
  } catch (err) {
    console.error("❌ Error creating user:", err);
    return res.status(500).json({ error: err.message });
  }
});

// 🔹 Update role / siswaId user
app.put("/users/:uid", (req, res) => {
  const { role, siswaId } = req.body;
  const { uid } = req.params;

  db.query(
    "UPDATE users SET role = ?, siswa_id = ? WHERE uid = ?",
    [role, siswaId, uid],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "User tidak ditemukan di MySQL" });
      }

      res.json({ message: "✅ Data user updated" });
    }
  );
});

// 🔹 Delete user (Firebase + MySQL)
app.delete("/users/:uid", async (req, res) => {
  const { uid } = req.params;

  try {
    await admin.auth().deleteUser(uid);
    console.log(`✅ Firebase user deleted: ${uid}`);

    db.query("DELETE FROM users WHERE uid = ?", [uid], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ message: "User tidak ditemukan di MySQL" });
      }

      res.json({ message: "✅ User deleted from Firebase & MySQL" });
    });
  } catch (err) {
    console.error("❌ Error deleting user:", err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================================
// 🔹 LOGIN dengan Firebase ID Token (dengan debug log detail)
// ==========================================================
app.post("/login", async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: "idToken wajib dikirim" });
  }

  try {
    // ✅ Verifikasi token ke Firebase
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    console.log("======================================");
    console.log("🔑 UID dari Firebase:", uid);
    console.log("📧 Email dari Firebase:", decodedToken.email);

    // ✅ Cek di MySQL
    const sql = "SELECT * FROM users WHERE uid = ?";
    console.log("📤 Query ke MySQL:", sql, [uid]);

    const [rows] = await db.promise().query(sql, [uid]);
    console.log("📥 Hasil dari MySQL:", rows);

    if (rows.length === 0) {
      console.log("❌ User tidak ditemukan di tabel users MySQL");
      return res.status(404).json({ error: "User tidak ditemukan di MySQL" });
    }

    console.log("✅ User ditemukan di MySQL:", rows[0]);
    res.json({ user: mapUser(rows[0]) });
  } catch (err) {
    console.error("❌ Error login:", err);
    res.status(401).json({ error: "Token tidak valid" });
  }
});

// ==========================================================
// 🔹 UPDATE DATA SISWA DI FIRESTORE (HANYA DIRI SENDIRI / ADMIN)
// ==========================================================
app.put("/firestore/siswa/:id", authenticateToken, canEditSiswa, async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, kelas, nisn } = req.body;

    if (!nama && !kelas && !nisn)
      return res.status(400).json({ error: "Tidak ada data yang dikirim" });

    const siswaRef = firestore.collection("siswa").doc(id);
    const docSnap = await siswaRef.get();

    if (!docSnap.exists)
      return res.status(404).json({ error: "Data siswa tidak ditemukan di Firestore" });

    await siswaRef.update({
      ...(nama && { nama }),
      ...(kelas && { kelas }),
      ...(nisn && { nisn }),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ message: "✅ Data siswa berhasil diupdate di Firestore" });
  } catch (err) {
    console.error("❌ Gagal update Firestore:", err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================================
// 🔹 Jalankan server
// ==========================================================
app.listen(5000, () => {
  console.log("🚀 Server running at http://localhost:5000");
});
