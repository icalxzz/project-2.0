import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { getDatabase, ref, get, set, remove } from "firebase/database";
import * as XLSX from "xlsx";

// 🔹 Nama hari Indonesia
const getDayName = (date) => {
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  return days[date.getDay()];
};

// 🔹 Format tanggal Indo: Senin, 1 September 2025
const formatTanggalIndo = (dateStr) => {
  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  const date = new Date(dateStr);
  return `${getDayName(date)}, ${date.getDate()} ${
    months[date.getMonth()]
  } ${date.getFullYear()}`;
};

// 🔹 Format tanggal ESP
const formatTanggalESP = (date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}-${month}-${day}`;
};

const AdminPage = () => {
  const [absensi, setAbsensi] = useState([]);
  const [idSiswa, setIdSiswa] = useState("");
  const [status, setStatus] = useState("hadir");

  const [searchKelas, setSearchKelas] = useState(""); // Ubah dari filterKelas
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchNama, setSearchNama] = useState("");
  const [sortBy, setSortBy] = useState("tanggal");

  const rtdb = getDatabase();

  const formatTime = (date) =>
    date.toLocaleTimeString("id-ID", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  // 🔹 Ambil absensi
  const getAbsensi = async () => {
    try {
      const dbRef = ref(rtdb, "absensi");
      const snapshot = await get(dbRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        let allData = [];

        Object.keys(data).forEach((tanggal) => {
          Object.keys(data[tanggal]).forEach((id) => {
            allData.push({ ...data[tanggal][id], idDoc: id, tanggal });
          });
        });

        if (sortBy === "tanggal") {
          allData.sort(
            (a, b) =>
              new Date(`${b.tanggal}T${b.waktu}`) -
              new Date(`${a.tanggal}T${a.waktu}`)
          );
        } else if (sortBy === "id") {
          allData.sort((a, b) => Number(a.id) - Number(b.id));
        }

        setAbsensi(allData);
      } else {
        setAbsensi([]);
      }
    } catch (err) {
      console.error("❌ Gagal ambil data:", err);
    }
  };

  useEffect(() => {
    getAbsensi();
  }, [sortBy]);

  // 🔹 Tambah absensi manual
  const handleAddAbsensi = async (e) => {
    e.preventDefault();
    const today = formatTanggalESP(new Date());
    const waktu = formatTime(new Date());

    try {
      if (!idSiswa.trim()) return alert("❌ ID Siswa wajib diisi!");

      const siswaRef = doc(db, "siswa", idSiswa.trim());
      const siswaSnap = await getDoc(siswaRef);
      if (!siswaSnap.exists()) return alert("❌ ID Siswa tidak ditemukan!");

      const siswaData = siswaSnap.data();
      const absenRef = ref(rtdb, `absensi/${today}/${idSiswa}`);
      const absenSnap = await get(absenRef);

      if (absenSnap.exists()) return alert("⚠️ Sudah absen hari ini!");

      await set(absenRef, {
        id: idSiswa,
        nama: siswaData.nama || "Tanpa Nama",
        kelas: siswaData.kelas || "-",
        status_kehadiran: status,
        tanggal: today,
        waktu,
      });

      alert(`✅ Absensi ${siswaData.nama} berhasil disimpan!`);
      setIdSiswa("");
      setStatus("hadir");
      getAbsensi();
    } catch (err) {
      console.error(err);
      alert("❌ Gagal menambahkan absensi.");
    }
  };

  // 🔹 Hapus absensi
  const handleDeleteAbsensi = async (tanggal, idSiswa) => {
    if (!window.confirm("Yakin hapus data ini?")) return;
    try {
      await remove(ref(rtdb, `absensi/${tanggal}/${idSiswa}`));
      getAbsensi();
    } catch (err) {
      console.error("❌ Hapus gagal:", err);
    }
  };

  // 🔹 Export Excel
  const handleExportExcel = (tanggal) => {
    const data = absensi
      .filter((a) => a.tanggal === tanggal)
      .map(({ id, nama, kelas, status_kehadiran, tanggal, waktu }) => ({
        ID: id,
        Nama: nama,
        Kelas: kelas,
        Status: status_kehadiran,
        Tanggal: formatTanggalIndo(tanggal),
        Waktu: waktu,
      }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, tanggal);
    XLSX.writeFile(workbook, `Absensi_${tanggal}.xlsx`);
  };

  // 🔹 Filter
  const filteredAbsensi = absensi.filter((item) => {
    const matchKelas =
      searchKelas === "" ||
      item.kelas?.toLowerCase().includes(searchKelas.toLowerCase());
    const matchStatus =
      filterStatus === "all" || item.status_kehadiran === filterStatus;
    const matchNama =
      searchNama === "" ||
      item.nama?.toLowerCase().includes(searchNama.toLowerCase());
    return matchKelas && matchStatus && matchNama;
  });

  // 🔹 Group by tanggal
  const groupedAbsensi = filteredAbsensi.reduce((groups, item) => {
    if (!groups[item.tanggal]) groups[item.tanggal] = [];
    groups[item.tanggal].push(item);
    return groups;
  }, {});
  const sortedTanggal = Object.keys(groupedAbsensi).sort(
    (a, b) => new Date(b) - new Date(a)
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-20 px-4 sm:px-6 md:px-10 space-y-10">
      {/* Form tambah absensi */}
      <div className="bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg">
        <h2 className="text-lg sm:text-xl font-bold mb-4">Input Absensi</h2>
        <form
          onSubmit={handleAddAbsensi}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <input
            type="text"
            placeholder="ID Siswa"
            value={idSiswa}
            onChange={(e) => setIdSiswa(e.target.value)}
            className="px-4 py-2 rounded-full w-full md:w-1/1
              bg-white/90 text-gray-900 placeholder-gray-500 
                shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-4 py-2 rounded-full w-full md:w-1/1 
              bg-white/90 text-gray-900 placeholder-gray-600 
                shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="hadir">Hadir</option>
            <option value="telat">Telat</option>
            <option value="sakit">Sakit</option>
            <option value="izin">Izin</option>
            <option value="alpha">Alpha</option>
          </select>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 rounded px-4 py-2"
          >
            Simpan
          </button>
        </form>
      </div>

      {/* Filter */}
      <div className="bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg">
        <h2 className="text-lg sm:text-xl font-bold mb-4">Search</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* ⭐ FILTER KELAS BERUBAH MENJADI SEARCH INPUT */}
          <input
            type="text"
            placeholder="Cari Kelas..."
            value={searchKelas}
            onChange={(e) => setSearchKelas(e.target.value)}
            className="px-4 py-2 rounded-full w-full md:w-1/1 
              bg-white/90 text-gray-900 placeholder-gray-600 
                shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
          />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 rounded-full w-full md:w-1/1 
              bg-white/90 text-gray-900 placeholder-gray-600 
                shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="all">Semua Status</option>
            <option value="hadir">Hadir</option>
            <option value="telat">Telat</option>
            <option value="sakit">Sakit</option>
            <option value="izin">Izin</option>
            <option value="alpha">Alpha</option>
          </select>

          <input
            type="text"
            placeholder="Cari Nama..."
            value={searchNama}
            onChange={(e) => setSearchNama(e.target.value)}
            className="px-4 py-2 rounded-full w-full md:w-1/1 
              bg-white/90 text-gray-900 placeholder-gray-600 
                shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
          />

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 rounded-full w-full md:w-1/1 
              bg-white/90 text-gray-900 placeholder-gray-600 
                shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="tanggal">Urutkan: Tanggal</option>
            <option value="id">Urutkan: ID</option>
          </select>
        </div>
      </div>

      {/* Tabel absensi */}
      {sortedTanggal.length > 0 ? (
        sortedTanggal.map((tanggal) => (
          <div key={tanggal} className="bg-slate-800 p-4 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="text-base sm:text-lg font-bold">
                📅 {formatTanggalIndo(tanggal)}
              </h2>
              <button
                onClick={() => handleExportExcel(tanggal)}
                className="bg-[#3b3a62] hover:bg-[#484775] px-4 py-2 rounded w-full sm:w-auto"
              >
                🚀 Export
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-700 text-white">
                  <tr>
                    <th className="p-2 text-left">ID</th>
                    <th className="p-2 text-left">Nama</th>
                    <th className="p-2 text-left">Kelas</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-left">Tanggal</th>
                    <th className="p-2 text-left">Waktu</th>
                    <th className="p-2 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedAbsensi[tanggal].map((item) => (
                    <tr
                      key={item.idDoc}
                      className="border-t border-slate-600 hover:bg-slate-700/40"
                    >
                      <td className="p-2">{item.id}</td>
                      <td className="p-2">{item.nama}</td>
                      <td className="p-2">{item.kelas}</td>
                      <td className="p-2 capitalize">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            item.status_kehadiran === "hadir"
                              ? "bg-green-600"
                              : item.status_kehadiran === "telat"
                              ? "bg-yellow-600"
                              : item.status_kehadiran === "izin"
                              ? "bg-blue-600"
                              : item.status_kehadiran === "sakit"
                              ? "bg-orange-600"
                              : "bg-red-600"
                          }`}
                        >
                          {item.status_kehadiran}
                        </span>
                      </td>
                      <td className="p-2">{formatTanggalIndo(item.tanggal)}</td>
                      <td className="p-2">{item.waktu}</td>
                      <td className="p-2 text-center">
                        <button
                          onClick={() =>
                            handleDeleteAbsensi(item.tanggal, item.id)
                          }
                          className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      ) : (
        <p className="text-center text-gray-400">Tidak ada data absensi</p>
      )}
    </div>
  );
};

export default AdminPage;