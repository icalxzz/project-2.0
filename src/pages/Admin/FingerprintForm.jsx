// src/pages/FingerprintForm.jsx
import { useState } from "react";
import { db, auth } from "../../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getIdTokenResult } from "firebase/auth";

export default function FingerprintForm() {
  const [formData, setFormData] = useState({
    id: "",
    nama: "",
    kelas: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.id || !formData.nama || !formData.kelas) {
      alert("⚠️ Semua field wajib diisi!");
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        alert("❌ Kamu harus login terlebih dahulu!");
        setLoading(false);
        return;
      }

      const tokenResult = await getIdTokenResult(user);
      if (tokenResult.claims.role !== "admin") {
        alert("❌ Gagal menyimpan data! Kamu tidak punya izin (bukan admin).");
        setLoading(false);
        return;
      }

      await setDoc(doc(db, "siswa", formData.id), {
        id: formData.id,
        nama: formData.nama,
        kelas: formData.kelas,
        createdAt: serverTimestamp(),
      });

      alert("✅ Pendaftaran sidik jari berhasil disimpan!");
      setFormData({ id: "", nama: "", kelas: "" });
    } catch (error) {
      console.error("❌ Error menyimpan data:", error);
      if (error.code === "permission-denied") {
        alert("❌ Kamu tidak punya izin (bukan admin).");
      } else if (error.code === "unavailable") {
        alert("📡 Periksa koneksi internet kamu.");
      } else {
        alert("❌ Gagal menyimpan data! " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900 px-4">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-6 sm:p-8 w-full max-w-md">
        <h2 className="text-lg sm:text-2xl font-bold text-center mb-6 text-gray-800 dark:text-white">
          Form Pendaftaran Sidik Jari
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {/* Input ID */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-1 text-sm sm:text-base">
              ID
            </label>
            <input
              type="text"
              name="id"
              value={formData.id}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              placeholder="Masukkan ID"
            />
          </div>

          {/* Input Nama */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-1 text-sm sm:text-base">
              Nama
            </label>
            <input
              type="text"
              name="nama"
              value={formData.nama}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              placeholder="Masukkan Nama"
            />
          </div>

          {/* Input Kelas */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-1 text-sm sm:text-base">
              Kelas
            </label>
            <input
              type="text"
              name="kelas"
              value={formData.kelas}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              placeholder="Contoh: XII-D"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full ${
              loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
            } text-white py-2 rounded-lg font-semibold transition duration-200 text-sm sm:text-base`}
          >
            {loading ? "Menyimpan..." : "Daftar"}
          </button>
        </form>
      </div>
    </div>
  );
}
