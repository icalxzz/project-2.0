import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Header from "./components/Header";
import ProtectedRoute from "./components/ProtectedRoute";
import HomePage from "./pages/Lobby/Home";
import Login from "./pages/Lobby/Login";
import AdminPage from "./pages/Admin/AdminPage";
import UserPage from "./pages/Users/UserPage";
import FingerprintForm from "./pages/Admin/FingerprintForm";
import AttendancePage from "./pages/Users/AttendancePage";
import Dashboard from "./pages/Admin/Dashboard"; // 🔹 Dashboard User Firebase

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  // 🔹 Cek user dari backend (kalau sudah login)
  useEffect(() => {
    const storedUid = localStorage.getItem("uid"); // simpan uid di localStorage setelah login
    if (storedUid) {
      fetch(`http://localhost:5000/users/${storedUid}`)
        .then((res) => res.json())
        .then((data) => setCurrentUser(data))
        .catch((err) => console.error("Error fetching user:", err));
    }
  }, []);

  console.log("Current User:", currentUser); // debug

  return (
    <Router>
      <Header currentUser={currentUser} setCurrentUser={setCurrentUser} />
      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route
          path="/login"
          element={<Login setCurrentUser={setCurrentUser} />}
        />

        {/* Protected - Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute currentUser={currentUser} role="admin">
              <AdminPage />
            </ProtectedRoute>
          }
        />

        {/* Protected - User */}
        <Route
          path="/user"
          element={
            <ProtectedRoute currentUser={currentUser} role="user">
              <UserPage />
            </ProtectedRoute>
          }
        />

        {/* 🔹 Form sidik jari (hanya admin) */}
        <Route
          path="/fingerprint-form"
          element={
            <ProtectedRoute currentUser={currentUser} role="admin">
              <FingerprintForm />
            </ProtectedRoute>
          }
        />

        {/* 🔹 Data kehadiran (hanya admin) */}
        <Route
          path="/attendance"
          element={
            <ProtectedRoute currentUser={currentUser} role={["admin", "user"]}>
              <AttendancePage />
            </ProtectedRoute>
          }
        />

        {/* 🔹 Dashboard User Firebase (hanya admin) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute currentUser={currentUser} role="admin">
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
