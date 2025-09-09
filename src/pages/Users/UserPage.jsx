const UserPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 text-white p-6">
      <div className="max-w-4xl w-full text-center">
        {/* Header */}
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
          Dashboard
        </h1>
        <p className="mt-4 text-xl md:text-2xl text-purple-200 font-light">
          Selamat datang kembali di halaman pengguna.
        </p>

        {/* Card Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          {/* Card Profil */}
          <div className="p-8 bg-white/10 backdrop-filter backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 transform transition-all duration-300 hover:scale-105 hover:bg-white/20">
            <h2 className="text-2xl font-semibold text-white">Profil Saya</h2>
            <p className="text-purple-200 mt-4 text-sm md:text-base">
              Kelola informasi pribadi, foto, dan pengaturan akun Anda.
            </p>
            <button className="mt-6 px-8 py-3 font-semibold bg-white text-purple-800 rounded-full shadow-lg hover:bg-gray-200 transition-colors">
              Lihat Profil
            </button>
          </div>

          {/* Card Aktivitas */}
          <div className="p-8 bg-white/10 backdrop-filter backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 transform transition-all duration-300 hover:scale-105 hover:bg-white/20">
            <h2 className="text-2xl font-semibold text-white">Riwayat Aktivitas</h2>
            <p className="text-purple-200 mt-4 text-sm md:text-base">
              Lihat catatan kehadiran dan riwayat interaksi Anda.
            </p>
            <button className="mt-6 px-8 py-3 font-semibold bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-colors">
              Lihat Riwayat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPage;