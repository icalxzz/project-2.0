import { useState, useEffect } from "react";
import axios from "axios";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default function EditProfile() {
  const [formData, setFormData] = useState({
    nama: "",
    kelas: "",
    nisn: "",
  });
  const [siswaId, setSiswaId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const API_URL = "http://localhost:5000"; // backend kamu

  // ==========================================================
  // 🔹 Ambil UID dari Firebase lalu cari siswa_id dari MySQL
  // ==========================================================
  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setMessage("❌ Kamu belum login!");
        return;
      }

      try {
        const token = await user.getIdToken();

        // 🔸 Ambil siswa_id dari MySQL berdasarkan UID login
        const res = await axios.get(`${API_URL}/user/${user.uid}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const siswaIdFromMySQL = res.data.siswaId;
        setSiswaId(siswaIdFromMySQL);

        // 🔸 Ambil data siswa dari Firestore (via backend juga)
        const firestoreRes = await axios.get(
          `${API_URL}/firestore/siswa/${siswaIdFromMySQL}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = firestoreRes.data;
        setFormData({
          nama: data.nama || "",
          kelas: data.kelas || "",
          nisn: data.nisn || "",
        });
      } catch (err) {
        console.error("❌ Gagal ambil data:", err);
        setMessage("waiting data");
      }
    });

    return () => unsubscribe();
  }, []);

  // ==========================================================
  // 🔹 Input handler
  // ==========================================================
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  // ==========================================================
  // 🔹 Submit handler: Update data Firestore lewat backend
  // ==========================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      setMessage("❌ Kamu belum login!");
      setLoading(false);
      return;
    }

    try {
      const token = await user.getIdToken();

      const res = await axios.put(
        `${API_URL}/firestore/siswa/${siswaId}`,
        {
          nama: formData.nama,
          kelas: formData.kelas,
          nisn: formData.nisn, // ✅ sudah bisa diedit
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMessage(res.data.message || "✅ Data berhasil diperbarui!");
    } catch (err) {
      console.error("❌ Gagal update:", err);
      setMessage(
        err.response?.data?.error || "Terjadi kesalahan saat memperbarui data."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // 🔹 UI Form dengan Tailwind (Dark/Light Mode)
  // ==========================================================
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900 px-4 transition-colors duration-300">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-6 sm:p-8 w-full max-w-md">
        <h2 className="text-lg sm:text-2xl font-bold text-center mb-6 text-gray-800 dark:text-white">
          
        </h2>

        {message && (
          <div
            className={`text-center mb-4 font-medium ${
              message.startsWith("✅") ? "text-green-600" : "text-red-500"
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ID Siswa */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-1 text-sm">
              ID Siswa
            </label>
            <input
              type="text"
              value={siswaId}
              readOnly
              className="w-full px-3 py-2 border rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed text-sm"
            />
          </div>

          {/* Nama */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-1 text-sm">
              Nama Lengkap
            </label>
            <input
              type="text"
              name="nama"
              value={formData.nama}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Masukkan Nama Lengkap"
            />
          </div>

          {/* Kelas */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-1 text-sm">
              Kelas
            </label>
            <input
              type="text"
              name="kelas"
              value={formData.kelas}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Contoh: XII-D"
            />
          </div>

          {/* NISN (sekarang bisa diedit) */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-1 text-sm">
              NISN
            </label>
            <input
              type="text"
              name="nisn"
              value={formData.nisn}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Masukkan NISN"
            />
          </div>

          {/* Tombol Simpan */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-lg font-semibold transition duration-200 text-sm sm:text-base ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {loading ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </form>
      </div>
    </div>
  );
}
