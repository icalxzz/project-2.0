import { motion } from "framer-motion";
import { ArrowRight, Users, Shield, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 1) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.2,
      duration: 0.6,
      ease: "easeOut",
    },
  }),
};

const Home = () => {
  return (
    <main className="bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-100 overflow-hidden">
      {/* Hero Section */}
      <section
        id="home"
        className="h-screen flex flex-col items-center justify-center text-center 
                   bg-gradient-to-br from-indigo-600 to-purple-700 
                   dark:from-indigo-700 dark:to-purple-900 
                   text-white px-6"
      >
        <motion.h1
          className="text-5xl md:text-6xl font-extrabold mb-6 drop-shadow-lg"
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Portfolio Kelompok Absensi Fingerprint
        </motion.h1>
        <motion.p
          className="text-lg md:text-xl max-w-2xl mb-8 opacity-90"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          Sebuah projek inovatif berbasis <b>ESP32 + Fingerprint</b> untuk
          menghadirkan sistem absensi digital yang cepat, aman, dan modern.
        </motion.p>
        <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}>
          <Link
          to="./login"
          className="px-8 py-3 bg-white text-indigo-700 font-semibold rounded-2xl 
               shadow-lg hover:bg-gray-100 dark:bg-gray-900 dark:text-white 
               dark:hover:bg-gray-800 transition">
                Next
          </Link>
        </motion.div>
      </section>

      {/* About Project */}
      <section className="py-20 px-6 max-w-5xl mx-auto text-center">
        <motion.h2
          className="text-3xl md:text-4xl font-bold mb-4"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          Tentang Projek
        </motion.h2>
        <motion.p
          className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={1}
        >
          Projek ini bertujuan untuk menciptakan sistem absensi yang memanfaatkan
          teknologi <b>ESP32</b> dan sensor <b>Fingerprint</b>, sehingga siswa
          maupun karyawan tidak bisa sembarangan melakukan titip absen. Data
          akan terekam otomatis dan dapat dipantau secara real-time melalui
          aplikasi berbasis web.
        </motion.p>
      </section>

      {/* Team Section */}
      <section id="team" className="py-20 px-6 max-w-6xl mx-auto text-center">
        <motion.h2
          className="text-3xl md:text-4xl font-bold mb-12"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          Tim Kami
        </motion.h2>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {[
            { name: "Candra", role: "Ketua Kelompok, Frontend Developer, Backend Developer, UI/UX Designer, IoT Specialist, Hardware Engineer, Database Engineer, System Analyst, Project Manajer, Tester, Documentation" },
            { name: "Anggota 1", role: "Member" },
            { name: "Anggota 2", role: "Member" },
            { name: "Anggota 3", role: "Member" },
            { name: "Anggota 4", role: "Member" },
            { name: "Anggota 5", role: "Member" },
            { name: "Anggota 6", role: "Member" },
            { name: "Anggota 7", role: "Member" },
            { name: "Anggota 8", role: "Member" },
            { name: "Anggota 9", role: "Member" },
            { name: "Anggota 10", role: "Member" },
          ].map((member, i) => (
            <motion.div
              key={i}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 hover:shadow-xl transition"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i}
            >
              {/* Foto anggota (placeholder dari unsplash) */}
              <img
                src={`https://source.unsplash.com/200x200/?portrait,${i}`}
                alt={member.name}
                className="w-24 h-24 mx-auto mb-4 rounded-full object-cover border-4 border-indigo-500 shadow"
              />
              <h3 className="text-lg font-bold">{member.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{member.role}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-20 px-6 max-w-6xl mx-auto grid md:grid-cols-3 gap-8"
      >
        {[
          {
            Icon: Users,
            color: "text-indigo-600 dark:text-indigo-400",
            title: "Multi User",
            text: "Dapat digunakan oleh banyak pengguna secara bersamaan.",
          },
          {
            Icon: Shield,
            color: "text-green-600 dark:text-green-400",
            title: "Keamanan Data",
            text: "Data tersimpan dengan aman menggunakan enkripsi modern.",
          },
          {
            Icon: Clock,
            color: "text-purple-600 dark:text-purple-400",
            title: "Realtime",
            text: "Absensi terekam secara langsung tanpa delay.",
          },
        ].map((item, i) => (
          <motion.div
            key={i}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-md 
                       p-8 text-center hover:shadow-xl transition"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={i}
          >
            <item.Icon className={`w-12 h-12 mx-auto mb-4 ${item.color}`} />
            <h3 className="text-xl font-bold mb-2">{item.title}</h3>
            <p className="text-gray-600 dark:text-gray-300">{item.text}</p>
          </motion.div>
        ))}
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-100 dark:bg-gray-900">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 text-center gap-6">
          {[
            { num: "11", label: "Anggota Tim", color: "text-indigo-600 dark:text-indigo-400" },
            { num: "1", label: "Ketua Kelompok", color: "text-green-600 dark:text-green-400" },
            { num: "70%", label: "Kerja Sama", color: "text-purple-600 dark:text-purple-400" },
            { num: "1", label: "Projek Inovatif", color: "text-red-600 dark:text-red-400" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={i}
            >
              <h3 className={`text-4xl font-bold ${stat.color}`}>{stat.num}</h3>
              <p className="text-gray-600 dark:text-gray-300">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section
        id="about"
        className="py-20 flex flex-col items-center justify-center 
                   bg-gradient-to-r from-indigo-600 to-purple-700 
                   dark:from-indigo-700 dark:to-purple-900 
                   text-white text-center px-6"
      >
        <motion.h2
          className="text-3xl md:text-4xl font-bold mb-4"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          Siap Mengenal Lebih Lanjut?
        </motion.h2>
        <motion.p
          className="mb-8 max-w-2xl opacity-90"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          custom={1}
        >
          Kami adalah tim beranggotakan 11 orang yang berkomitmen menghadirkan
          solusi absensi modern berbasis IoT. Mari bekerja sama untuk
          mengimplementasikan teknologi ini di dunia nyata.
        </motion.p>
        <motion.a
          href="https://www.canva.com/design/ID_PROJECT_MU/preview" // ganti dengan link PPT Canva
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
              className="px-8 py-3 bg-white text-indigo-700 font-semibold rounded-2xl 
                shadow-lg hover:bg-gray-100 dark:bg-gray-900 dark:text-white 
              dark:hover:bg-gray-800 transition">
                Lihat Presentasi Kami
          </motion.a>
      </section>

      {/* Footer */}
      <footer
        id="copyright"
        className="h-20 flex items-center justify-center 
                   bg-gray-900 text-gray-400 dark:bg-black dark:text-gray-500"
      >
        <p>© 2025 Informatika | All rights reserved.</p>
      </footer>
    </main>
  );
};

export default Home;
