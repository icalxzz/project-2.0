import { useEffect, useState } from "react";
import { getDatabase, ref, get } from "firebase/database";
import * as XLSX from "xlsx";

const AttendancePage = () => {
  const [attendance, setAttendance] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });
  const [searchTerm, setSearchTerm] = useState("");
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

  // 🔹 Sorting
  const sortedData = [...attendance].sort((a, b) => {
    if (sortConfig.key === "id") {
      if (a.id < b.id) return sortConfig.direction === "asc" ? -1 : 1;
      if (a.id > b.id) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    }

    if (sortConfig.key === "tanggal") {
      const dateA = new Date(a.tanggal);
      const dateB = new Date(b.tanggal);
      return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
    }

    return 0;
  });

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // 🔎 Filter by search & status
  const filteredData = sortedData.filter((item) => {
    const matchesSearch = [item.id, item.nama, item.kelas]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || item.status_kehadiran === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // ⬇️ Export Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Absensi");
    XLSX.writeFile(workbook, "data-absensi.xlsx");
  };

  return (
    <div
      className="min-h-screen bg-slate-950 text-white pt-20 px-4 sm:px-6 md:px-10 space-y-10"
      style={{
        backgroundImage: "linear-gradient(to bottom, #150E2D, #080516)",
        fontFamily: "sans-serif",
      }}
    >
      <div className="p-6">
        {/* 🔎 Search, Filter, Export */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 relative z-10">
          {/* Search */}
              <input
                type="text"
                placeholder="Cari berdasarkan ID, Nama, atau Kelas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 rounded-full w-full md:w-1/3 
              bg-white/90 text-gray-900 placeholder-gray-500 
                shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                />

          {/* Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-full w-full md:w-1/3 
              bg-white/90 text-gray-900 placeholder-gray-500 
                shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <option value="all">Semua Status</option>
            <option value="Hadir">Hadir</option>
            <option value="Izin">Izin</option>
            <option value="Alpha">Alpha</option>
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
            Export Excel
          </button>
        </div>

        {/* 🔹 Table */}
        <div
          className="overflow-x-auto shadow-2xl rounded-2xl"
          style={{
            background: "rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(15px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          <table className="table-auto w-full border-collapse">
            <thead
              style={{
                background: "rgba(255, 255, 255, 0.15)",
                color: "white",
              }}
            >
              <tr>
                <th
                  className="px-6 py-4 text-left font-bold tracking-wider cursor-pointer"
                  onClick={() => requestSort("id")}
                >
                  ID{" "}
                  {sortConfig.key === "id"
                    ? sortConfig.direction === "asc"
                      ? "↑"
                      : "↓"
                    : ""}
                </th>
                <th className="px-6 py-4 text-left font-bold tracking-wider">
                  Nama
                </th>
                <th className="px-6 py-4 text-left font-bold tracking-wider">
                  Kelas
                </th>
                <th className="px-6 py-4 text-left font-bold tracking-wider">
                  Status
                </th>
                <th
                  className="px-6 py-4 text-left font-bold tracking-wider cursor-pointer"
                  onClick={() => requestSort("tanggal")}
                >
                  Tanggal{" "}
                  {sortConfig.key === "tanggal"
                    ? sortConfig.direction === "asc"
                      ? "↑"
                      : "↓"
                    : ""}
                </th>
                <th className="px-6 py-4 text-left font-bold tracking-wider">
                  Waktu
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => (
                <tr
                  key={index}
                  className="border-t"
                  style={{
                    borderColor: "rgba(255, 255, 255, 0.15)",
                    transition: "background-color 0.3s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor =
                      "rgba(255, 255, 255, 0.1)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  <td className="px-6 py-4">{item.id}</td>
                  <td className="px-6 py-4">{item.nama}</td>
                  <td className="px-6 py-4">{item.kelas}</td>
                  <td className="px-6 py-4">{item.status_kehadiran}</td>
                  <td className="px-6 py-4">{item.tanggal}</td>
                  <td className="px-6 py-4">{item.waktu}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
