import { useEffect, useState } from "react";
import { getDatabase, ref, get } from "firebase/database";
import * as XLSX from "xlsx";

const AttendancePage = () => {
  const [attendance, setAttendance] = useState([]);
  const [expandedStudents, setExpandedStudents] = useState({});
  const [searchNama, setSearchNama] = useState("");
  const [searchKelas, setSearchKelas] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetchAttendance = async () => {
      const db = getDatabase();
      const dbRef = ref(db, "absensi");

      try {
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          let allData = [];

          Object.keys(data).forEach((tanggal) => {
            const records = data[tanggal];
            Object.keys(records).forEach((id) => {
              allData.push({
                ...records[id],
                tanggal,
              });
            });
          });

          setAttendance(allData);
        }
      } catch (error) {
        console.error("Error fetching attendance:", error);
      }
    };

    fetchAttendance();
  }, []);

  // 🔹 Kelompokkan data per siswa
  const groupedByStudent = attendance.reduce((acc, item) => {
    const key = `${item.id}-${item.nama}-${item.kelas}`;
    if (!acc[key]) {
      acc[key] = {
        id: item.id,
        nama: item.nama,
        kelas: item.kelas,
        records: [],
      };
    }
    acc[key].records.push(item);
    return acc;
  }, {});

  // 🔎 Filter berdasarkan search nama dan kelas
  const filteredStudents = Object.values(groupedByStudent).filter((student) => {
    const matchNama =
      searchNama === "" ||
      student.nama?.toLowerCase().includes(searchNama.toLowerCase());
    const matchKelas =
      searchKelas === "" ||
      student.kelas?.toLowerCase().includes(searchKelas.toLowerCase());
    return matchNama && matchKelas;
  });

  // 🔹 Filter records berdasarkan status
  const getFilteredRecords = (records) => {
    if (statusFilter === "all") return records;
    return records.filter((r) => r.status_kehadiran === statusFilter);
  };

  // 🔹 Toggle expand/collapse per siswa
  const toggleStudent = (studentKey) => {
    setExpandedStudents((prev) => ({
      ...prev,
      [studentKey]: !prev[studentKey],
    }));
  };

  // 📊 Hitung statistik per siswa
  const getStudentStats = (records) => {
    const filteredRecs = getFilteredRecords(records);
    const total = records.length;
    const hadir = records.filter((r) => r.status_kehadiran === "hadir").length;
    const telat = records.filter((r) => r.status_kehadiran === "telat").length;
    const sakit = records.filter((r) => r.status_kehadiran === "sakit").length;
    const izin = records.filter((r) => r.status_kehadiran === "izin").length;
    const alpha = records.filter((r) => r.status_kehadiran === "alpha").length;

    return { total, hadir, telat, sakit, izin, alpha, filtered: filteredRecs };
  };

  // ⬇️ Export Excel
  const exportToExcel = () => {
    const exportData = [];
    filteredStudents.forEach((student) => {
      const stats = getStudentStats(student.records);
      stats.filtered.forEach((record) => {
        exportData.push({
          ID: student.id,
          Nama: student.nama,
          Kelas: student.kelas,
          Status: record.status_kehadiran,
          Tanggal: record.tanggal,
          Waktu: record.waktu,
        });
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Absensi");
    XLSX.writeFile(workbook, "data-absensi.xlsx");
  };

  return (
    <div
      className="min-h-screen bg-slate-950 text-white pt-20 px-4 sm:px-6 md:px-10 space-y-10 pb-10"
      style={{
        backgroundImage: "linear-gradient(to bottom, #150E2D, #080516)",
        fontFamily: "sans-serif",
      }}
    >
      <div className="p-6">
        {/* 🔎 Search, Filter, Export */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 relative z-10">
          {/* Search Nama */}
          <input
            type="text"
            placeholder="Cari Nama..."
            value={searchNama}
            onChange={(e) => setSearchNama(e.target.value)}
            className="px-4 py-2 rounded-full w-full md:w-1/4 
              bg-white/90 text-gray-900 placeholder-gray-500 
                shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
          />

          {/* Search Kelas */}
          <input
            type="text"
            placeholder="Cari Kelas..."
            value={searchKelas}
            onChange={(e) => setSearchKelas(e.target.value)}
            className="px-4 py-2 rounded-full w-full md:w-1/4 
              bg-white/90 text-gray-900 placeholder-gray-500 
                shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
          />

          {/* Filter Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-full w-full md:w-1/4 
              bg-white/90 text-gray-900 placeholder-gray-500 
                shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="all">Semua Status</option>
            <option value="hadir">Hadir</option>
            <option value="izin">Izin</option>
            <option value="alpha">Alpha</option>
            <option value="telat">Telat</option>
            <option value="sakit">Sakit</option>
          </select>

          {/* Export */}
          <button
            onClick={exportToExcel}
            className="px-6 py-2 rounded-full font-semibold shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 w-full md:w-auto"
            style={{
              background: "linear-gradient(90deg, #A564FF, #00C6FF)",
              color: "white",
              border: "2px solid rgba(255, 255, 255, 0.3)",
              cursor: "pointer",
              textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
            }}
          >
            📥 Export Excel
          </button>
        </div>

        {/* 🔹 Grouped Students List */}
        <div className="space-y-4">
          {filteredStudents.map((student) => {
            const studentKey = `${student.id}-${student.nama}-${student.kelas}`;
            const isExpanded = expandedStudents[studentKey];
            const stats = getStudentStats(student.records);

            return (
              <div
                key={studentKey}
                style={{
                  background: "rgba(255, 255, 255, 0.08)",
                  backdropFilter: "blur(15px)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                }}
                className="rounded-2xl shadow-lg overflow-hidden"
              >
                {/* Header - Info Siswa */}
                <button
                  onClick={() => toggleStudent(studentKey)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-4 text-left flex-1">
                    <div className="text-2xl">
                      {isExpanded ? "📂" : "📁"}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{student.nama}</h3>
                      <p className="text-sm text-gray-300">
                        ID: {student.id} | Kelas: {student.kelas}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      Total: <span className="text-blue-300">{stats.total}</span>
                    </p>
                    <div className="text-xs text-gray-300 flex gap-2">
                      <span className="text-green-400">✓ {stats.hadir}</span>
                      <span className="text-yellow-400">⏱ {stats.telat}</span>
                      <span className="text-orange-400">🤒 {stats.sakit}</span>
                      <span className="text-blue-400">📋 {stats.izin}</span>
                      <span className="text-red-400">✗ {stats.alpha}</span>
                    </div>
                  </div>
                </button>

                {/* Detail - Riwayat Kehadiran */}
                {isExpanded && (
                  <div className="border-t border-white/20 px-6 py-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr
                            style={{
                              background: "rgba(255, 255, 255, 0.1)",
                            }}
                          >
                            <th className="px-4 py-2 text-left font-semibold">
                              Status
                            </th>
                            <th className="px-4 py-2 text-left font-semibold">
                              Tanggal
                            </th>
                            <th className="px-4 py-2 text-left font-semibold">
                              Waktu
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.filtered.length > 0 ? (
                            stats.filtered.map((record, idx) => (
                              <tr
                                key={idx}
                                style={{
                                  borderColor: "rgba(255, 255, 255, 0.1)",
                                }}
                                className="border-t hover:bg-white/5 transition-colors"
                              >
                                <td className="px-4 py-2">
                                  <span
                                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                      record.status_kehadiran === "hadir"
                                        ? "bg-green-600 text-white"
                                        : record.status_kehadiran === "telat"
                                        ? "bg-yellow-600 text-white"
                                        : record.status_kehadiran === "sakit"
                                        ? "bg-orange-600 text-white"
                                        : record.status_kehadiran === "izin"
                                        ? "bg-blue-600 text-white"
                                        : "bg-red-600 text-white"
                                    }`}
                                  >
                                    {record.status_kehadiran}
                                  </span>
                                </td>
                                <td className="px-4 py-2">
                                  {record.tanggal}
                                </td>
                                <td className="px-4 py-2">
                                  {record.waktu}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan="3"
                                className="px-4 py-4 text-center text-gray-400"
                              >
                                Tidak ada data dengan filter ini
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filteredStudents.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg">Tidak ada data siswa yang sesuai</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;