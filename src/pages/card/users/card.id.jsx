import { useState } from "react";

const BiodataCard = ({ biodata }) => {
  const [showBiodata, setShowBiodata] = useState(false);

  return (
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
            <h2 className="text-2xl font-semibold text-white">Profil Saya</h2>
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
            <h2 className="text-2xl font-semibold text-white">Biodata Siswa</h2>
            {biodata ? (
              <ul className="mt-4 space-y-2 text-purple-200 text-left">
                <li>
                  <span className="font-semibold text-white">Nama:</span>{" "}
                  {biodata.nama}
                </li>
                <li>
                  <span className="font-semibold text-white">NIS:</span>{" "}
                  {biodata.nis}
                </li>
                <li>
                  <span className="font-semibold text-white">Kelas:</span>{" "}
                  {biodata.kelas}
                </li>
                <li>
                  <span className="font-semibold text-white">Jurusan:</span>{" "}
                  {biodata.jurusan}
                </li>
              </ul>
            ) : (
              <p className="text-purple-200 mt-4">❌ Biodata tidak ditemukan.</p>
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
  );
};

export default BiodataCard;
