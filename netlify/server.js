import express from "express";
import serverless from "serverless-http";
import cors from "cors";
import admin from "firebase-admin";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// --- inisialisasi Firebase sama seperti yang sudah kamu buat ---
const serviceAccount = JSON.parse(fs.readFileSync(process.env.FIREBASE_KEY_PATH, "utf-8"));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DB_URL,
});
const db = admin.firestore();

// contoh route
app.get("/api", (req, res) => res.json({ ok: true }));

// export jadi handler Netlify
export const handler = serverless(app);
