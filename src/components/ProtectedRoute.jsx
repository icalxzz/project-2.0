import { Navigate } from "react-router-dom";

/**
 * ProtectedRoute
 * @param {JSX.Element} children -> komponen yang akan dirender
 * @param {string|string[]} role -> role yang dibutuhkan ("admin", "user", atau ["admin", "user"])
 * @param {object} currentUser -> data user yang sedang login { email, role }
 */
const ProtectedRoute = ({ children, role, currentUser }) => {
  if (!currentUser) {
    // Belum login
    return <Navigate to="/login" replace />;
  }

  if (role) {
    // Kalau role berupa array
    if (Array.isArray(role) && !role.includes(currentUser.role)) {
      return <Navigate to="/login" replace />;
    }

    // Kalau role berupa string
    if (typeof role === "string" && currentUser.role !== role) {
      return <Navigate to="/login" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
