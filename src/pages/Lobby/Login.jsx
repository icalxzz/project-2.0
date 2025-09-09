import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";
import { useNavigate } from "react-router-dom";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "/.netlify/functions/server";


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
      // 🔹 1. Login ke Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // 🔹 2. Ambil Firebase ID Token
      const idToken = await user.getIdToken();

      // 🔹 3. Simpan uid + token ke localStorage
      localStorage.setItem("uid", user.uid);
      localStorage.setItem("token", idToken);

      // 🔹 4. Ambil role + data user dari backend
      const res = await fetch(`${BACKEND_URL}/users/${user.uid}`, {
        headers: {
          Authorization: `Bearer ${idToken}`, // <= WAJIB
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Gagal ambil data user dari server");
      }

      const userData = await res.json();

      // 🔹 5. Simpan ke state global
      setCurrentUser(userData);

      // 🔹 6. Redirect sesuai role
      redirectByRole(userData.role, navigate);
    } catch (err) {
      console.error("Login error:", err);
      setError("Login gagal: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Fungsi helper redirect berdasarkan role
  const redirectByRole = (role, navigate) => {
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
