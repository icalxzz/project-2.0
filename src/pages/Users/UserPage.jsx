import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getDatabase, ref, onValue } from "firebase/database";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import UserPageStyles from "../css/UserPages";
import CalendarAbsensi from "/2.0/src/components/calendar";

// API endpoint (netlify / local)
const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "/.netlify/functions";

// Warna Pie Chart
const COLORS = ["#34D399", "#FBBF24", "#EF4444", "#60A5FA", "#A78BFA"];

const UserPage = () => {
  const [showBiodata, setShowBiodata] = useState(false);
  const [biodata, setBiodata] = useState(null);
  const [riwayatKehadiran, setRiwayatKehadiran] = useState([]);
  const [statistik, setStatistik] = useState([]);
  const [statusByDate, setStatusByDate] = useState({});
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");

  const db = getFirestore();
  const rtdb = getDatabase();
  const auth = getAuth();

  useEffect(() => {
    let onValueUnsubscribe = null;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserEmail(user.email);
        setLoading(true);

        try {
          // 🔹 Step 1: Ambil siswaId dari backend
          const res = await fetch(`${API_BASE}/user/${user.uid}`);
          const data = await res.json();

          if (data.siswaId) {
            // 🔹 Step 2: Ambil biodata siswa dari Firestore
            const siswaRef = doc(db, "siswa", data.siswaId.toString());
            const siswaSnap = await getDoc(siswaRef);

            if (siswaSnap.exists()) {
              setBiodata({ id: data.siswaId, ...siswaSnap.data() });

              // 🔹 Step 3: Ambil absensi dari RTDB sesuai siswaId
              const absensiRef = ref(rtdb, "absensi");
              onValueUnsubscribe = onValue(absensiRef, (snapshot) => {
                if (snapshot.exists()) {
                  const rawData = snapshot.val();
                  const list = [];
                  const count = {
                    hadir: 0,
                    telat: 0,
                    alpha: 0,
                    sakit: 0,
                    izin: 0,
                  };
                  const statusMap = {};

                  Object.entries(rawData).forEach(([tanggal, siswaMap]) => {
                    if (siswaMap[data.siswaId]) {
                      const record = siswaMap[data.siswaId];
                      const status = record.status_kehadiran?.toLowerCase();

                      list.push({
                        tanggal,
                        waktu: record.waktu,
                        status,
                      });

                      if (count[status] !== undefined) count[status]++;

                      // Normalisasi tanggal untuk kalender
                      const [y, m, d] = tanggal.split("-");
                      const normalized = `${parseInt(y)}-${parseInt(m)}-${parseInt(
                        d
                      )}`;
                      statusMap[normalized] = status;
                    }
                  });

                  list.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

                  setRiwayatKehadiran(list);

                  const chartData = Object.entries(count)
                    .filter(([, val]) => val > 0)
                    .map(([key, val]) => ({
                      name: key.charAt(0).toUpperCase() + key.slice(1),
                      value: val,
                    }));

                  setStatistik(chartData);
                  setStatusByDate(statusMap);
                } else {
                  setRiwayatKehadiran([]);
                  setStatistik([]);
                  setStatusByDate({});
                }
                setLoading(false);
              });
            } else {
              setBiodata(null);
              setLoading(false);
            }
          } else {
            setBiodata(null);
            setLoading(false);
          }
        } catch (err) {
          console.error("🔥 Error fetching user data:", err);
          setLoading(false);
        }
      } else {
        setBiodata(null);
        setRiwayatKehadiran([]);
        setStatistik([]);
        setStatusByDate({});
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (onValueUnsubscribe) onValueUnsubscribe();
    };
  }, [auth, db, rtdb]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-white">
        Loading...
      </div>
    );
  }

  const totalHadir = statistik.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 text-white p-6">
      <UserPageStyles />

      <div className="max-w-6xl w-full text-center pt-24">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
          Dashboard
        </h1>
        <p className="mt-4 text-xl md:text-2xl text-purple-200 font-light">
          Selamat datang kembali,{" "}
          <span className="font-semibold">{userEmail}</span>
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          {/* Biodata */}
          <div className="flex flex-col gap-8">
            <div className="relative w-full h-80 [perspective:1200px]">
              <div
                className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${
                  showBiodata
                    ? "[transform:rotateY(180deg)] shadow-2xl"
                    : "shadow-lg"
                }`}
              >
                {/* Front */}
                <div className="absolute inset-0 p-8 bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 flex flex-col justify-between [backface-visibility:hidden]">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">
                      Profil Saya
                    </h2>
                    <p className="text-purple-200 mt-4">
                      Kelola informasi pribadi & akun Anda.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowBiodata(true)}
                    className="px-8 py-3 font-semibold bg-white text-purple-800 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    Lihat Profil
                  </button>
                </div>

                {/* Back */}
                <div className="absolute inset-0 p-8 bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 flex flex-col justify-between [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">
                      Biodata Siswa
                    </h2>
                    {biodata ? (
                      <ul className="mt-4 space-y-2 text-purple-200 text-left">
                        <li>
                          <span className="font-semibold text-white">Nama:</span>{" "}
                          {biodata.nama}
                        </li>
                        <li>
                          <span className="font-semibold text-white">Kelas:</span>{" "}
                          {biodata.kelas}
                        </li>
                        <li>
                          <span className="font-semibold text-white">ID:</span>{" "}
                          {biodata.id}
                        </li>
                      </ul>
                    ) : (
                      <p className="text-purple-200 mt-4">
                        ❌ Biodata tidak ditemukan.
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setShowBiodata(false)}
                    className="px-8 py-3 font-semibold bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
                  >
                    Kembali
                  </button>
                </div>
              </div>
            </div>

            {/* Kalender Absensi */}
            <CalendarAbsensi statusByDate={statusByDate} />
          </div>

          {/* Riwayat + Statistik */}
          <div className="w-full p-8 bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-lg text-left">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Riwayat Kehadiran
            </h2>

            {statistik.length > 0 ? (
              <div className="h-64 mb-6 flex justify-center items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statistik}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      dataKey="value"
                    >
                      {statistik.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [
                        `${value} (${((value / totalHadir) * 100).toFixed(1)}%)`,
                        name,
                      ]}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-purple-200">❌ Belum ada data kehadiran.</p>
            )}

            {totalHadir > 0 && (
              <div className="mb-6 space-y-1 text-purple-200">
                {statistik.map((s, idx) => (
                  <p key={idx}>
                    <span className="font-semibold text-white">{s.name}:</span>{" "}
                    {s.value} kali (
                    {((s.value / totalHadir) * 100).toFixed(1)}%)
                  </p>
                ))}
              </div>
            )}

            {riwayatKehadiran.length > 0 && (
              <div className="overflow-y-auto max-h-64 custom-scrollbar">
                <table className="w-full text-sm md:text-base text-purple-200">
                  <thead>
                    <tr className="border-b border-white/30 text-left">
                      <th className="py-2">Tanggal</th>
                      <th className="py-2">Waktu</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riwayatKehadiran.map((r, idx) => (
                      <tr key={idx} className="border-b border-white/10">
                        <td className="py-2">{r.tanggal}</td>
                        <td className="py-2">{r.waktu}</td>
                        <td
                          className={`py-2 font-semibold ${
                            r.status === "hadir"
                              ? "text-green-400"
                              : r.status === "telat"
                              ? "text-yellow-400"
                              : r.status === "alpha"
                              ? "text-red-400"
                              : r.status === "sakit"
                              ? "text-blue-400"
                              : "text-purple-400"
                          }`}
                        >
                          {r.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPage;
