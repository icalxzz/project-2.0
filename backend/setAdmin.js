// setAdmin.js
import admin from "firebase-admin";
import { readFileSync } from "fs";

// 🔑 Load service account JSON (download dari Firebase Console → Project Settings → Service Accounts)
const serviceAccount = JSON.parse(
  readFileSync("./serviceAccountKey.json", "utf-8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function setAdmin(uid) {
  try {
    await admin.auth().setCustomUserClaims(uid, { role: "admin" });
    console.log(`✅ Role admin diberikan ke user: ${uid}`);
    console.log("👉 Silakan logout lalu login ulang agar role terbaca.");
  } catch (err) {
    console.error("❌ Gagal set role admin:", err);
  }
}

// Ganti dengan UID user yang mau dijadikan admin
setAdmin("fkEq9FinOmY2F2F2aXzZzx7fcXn1");
