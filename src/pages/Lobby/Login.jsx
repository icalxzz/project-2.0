import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";
import { useNavigate } from "react-router-dom";

const BACKEND_URL =
  import.meta.env.DEV
    ? "http://localhost:5000"
    : import.meta.env.VITE_BACKEND_URL;

const Login = ({ setCurrentUser }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1️⃣ Login ke Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // 2️⃣ Ambil Firebase ID Token
      const idToken = await user.getIdToken();

      // 3️⃣ Simpan uid + token ke localStorage
      localStorage.setItem("uid", user.uid);
      localStorage.setItem("token", idToken);

      console.log("🔑 Firebase UID:", user.uid);
      console.log("🔑 Firebase Token:", idToken.substring(0, 20) + "...");

      // 4️⃣ Kirim ID Token ke backend untuk verifikasi & ambil data user
      const res = await fetch(`${BACKEND_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }), // 👈 kirim idToken, bukan uid
      });

      if (!res.ok) {
        throw new Error(`Gagal ambil data user: ${res.statusText}`);
      }

      const userData = await res.json();

      // 5️⃣ Simpan user ke state global
      setCurrentUser(userData.user);

      // 6️⃣ Redirect sesuai role
      redirectByRole(userData.user.role);
    } catch (err) {
      console.error("Login error:", err);
      setError("Login gagal: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Helper redirect
  const redirectByRole = (role) => {
    switch (role) {
      case "admin":
        navigate("/admin");
        break;
      case "user":
        navigate("/user");
        break;
      case "esp32":
        navigate("/dashboard");
        break;
      default:
        navigate("/");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-200 to-blue-400 dark:from-gray-900 dark:to-gray-800 transition">
      <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-2xl p-8 w-full max-w-md border border-gray-200 dark:border-gray-700">
        <h2 className="text-3xl font-extrabold text-center text-blue-600 dark:text-blue-400 mb-6">
          Selamat Datang
        </h2>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 mb-4 rounded-lg text-sm shadow-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 text-sm mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="masukkan email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none bg-gray-50 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 text-sm mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="masukkan password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 dark:border-gray-600 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none bg-gray-50 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 dark:bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition disabled:opacity-50 shadow-md"
          >
            {loading ? "Memproses..." : "Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Belum punya akun?{" "}
          <span className="text-blue-500 dark:text-blue-400 hover:underline cursor-pointer">
            Hubungi Admin
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
