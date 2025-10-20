const RiwayatCard = ({ riwayatKehadiran }) => {
  if (!Array.isArray(riwayatKehadiran) || riwayatKehadiran.length === 0) {
    return (
      <div className="p-6 bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-lg">
        <h2 className="text-2xl font-semibold text-white mb-4">
          Riwayat Kehadiran
        </h2>
        <p className="text-purple-200">❌ Belum ada riwayat kehadiran.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-lg">
      <h2 className="text-2xl font-semibold text-white mb-4">
        Riwayat Kehadiran
      </h2>
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
    </div>
  );
};

export default RiwayatCard;
