// routes/auth.js
import express from "express";
import db from "../db.js";

const router = express.Router();

// ✅ Simpan user baru dari Firebase ke MySQL
router.post("/", (req, res) => {
  const { uid, email, role, siswaId, name } = req.body; // sesuaikan dengan frontend

  if (!uid || !email) {
    return res.status(400).json({ error: "UID dan email harus ada" });
  }

  const newUser = { uid, name: name || null, email, role, siswaId };

  // Upsert: kalau uid sudah ada, update → kalau belum ada, insert
  db.query("SELECT * FROM tbl_users WHERE uid = ?", [uid], (err, results) => {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      // Insert user baru
      db.query("INSERT INTO tbl_users SET ?", newUser, (err2) => {
        if (err2) {
          console.error("Insert error:", err2);
          return res.status(500).json({ error: "Gagal insert user" });
        }
        return res.json({ message: "User berhasil dibuat", user: newUser });
      });
    } else {
      // Update data kalau sudah ada
      db.query(
        "UPDATE tbl_users SET name=?, role=?, siswaId=? WHERE uid=?",
        [name || results[0].name, role, siswaId, uid],
        (err3) => {
          if (err3) {
            console.error("Update error:", err3);
            return res.status(500).json({ error: "Gagal update user" });
          }
          return res.json({
            message: "User berhasil diupdate",
            user: { ...results[0], name, role, siswaId },
          });
        }
      );
    }
  });
});

// ✅ Hapus user
router.delete("/:uid", (req, res) => {
  const { uid } = req.params;
  db.query("DELETE FROM tbl_users WHERE uid = ?", [uid], (err) => {
    if (err) {
      console.error("Delete error:", err);
      return res.status(500).json({ error: "Gagal hapus user" });
    }
    res.json({ message: "User berhasil dihapus" });
  });
});

// ✅ Ambil semua user
router.get("/", (req, res) => {
  db.query("SELECT * FROM tbl_users", (err, results) => {
    if (err) {
      console.error("Fetch error:", err);
      return res.status(500).json({ error: "Gagal ambil user" });
    }
    res.json(results);
  });
});

export default router;
