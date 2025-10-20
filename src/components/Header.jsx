import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import {
  Menu,
  Home,
  LayoutDashboard,
  ClipboardList,
  Users,
  LogOut,
  User2Icon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = ({ currentUser, setCurrentUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout error:", err);
    }
    setCurrentUser(null);
    navigate("/");
  };

  // Menu dasar
  const baseNavList = [{ href: "/", label: "Home", icon: <Home size={20} /> }];

  // Menu role
  let roleNavList = [];
  if (currentUser) {
    if (currentUser.role === "admin") {
      roleNavList = [
        { href: "/admin", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
        { href: "/fingerprint-form", label: "Form", icon: <ClipboardList size={20} /> },
        { href: "/attendance", label: "Data Kehadiran", icon: <ClipboardList size={20} /> },
        { href: "/dashboard", label: "User Manager", icon: <Users size={20} /> },
      ];
    } else if (currentUser.role === "user") {
      roleNavList = [
        { href: "/user", label: "User Dashboard", icon: <LayoutDashboard size={20} /> },
        { href: "/attendance", label: "Data Kehadiran", icon: <ClipboardList size={20} /> },
        { href: "/Profile", label: "Profile", icon: <User2Icon size={20} /> },
      ];
    }
  }

  const navlist = [...baseNavList, ...roleNavList];

  return (
    <div className="relative">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-[#0f0c29] via-[#302b63] to-[#24243e] shadow-lg z-50">
        <div className="flex justify-between items-center px-4 py-3">
          <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 text-xl">
            Attendance 2.0
          </span>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-white text-2xl p-1 rounded hover:bg-white/10"
          >
            <Menu size={22} />
          </button>
        </div>
      </div>

      {/* Dropdown menu animasi */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              duration: 0.7,
              ease: [0.25, 1, 0.5, 1],
            }}
            className="fixed top-0 left-0 right-0 bg-gradient-to-b from-[#0f0c29] via-[#302b63] to-[#24243e] shadow-lg z-40 overflow-hidden rounded-b-2xl"
          >
            <nav className="flex flex-col mt-14 px-6 pb-6 space-y-4">
              {navlist.map((nav, index) => (
                <motion.div
                  key={nav.href}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.6,
                    delay: index * 0.12,
                    type: "spring",
                  }}
                >
                  <Link
                    to={nav.href}
                    className="flex items-center px-4 py-3 text-gray-200 hover:bg-purple-600 hover:text-white rounded-lg transition"
                    onClick={() => setIsOpen(false)}
                  >
                    <motion.span
                      initial={{ rotate: -10, x: -5 }}
                      animate={{ rotate: [ -10, 5, -3, 0 ], x: [ -5, 3, -2, 0 ] }}
                      transition={{
                        duration: 0.8,
                        delay: index * 0.12,
                        ease: "easeOut",
                      }}
                    >
                      {nav.icon}
                    </motion.span>
                    <span className="ml-3">{nav.label}</span>
                  </Link>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: navlist.length * 0.12 + 0.2 }}
                className="pt-4 border-t border-gray-700"
              >
                {currentUser ? (
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center w-full px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium shadow-md hover:shadow-lg hover:scale-105 transition">
                    <motion.span
                      initial={{ rotate: -10 }}
                      animate={{ rotate: [ -10, 8, -5, 0 ] }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    >
                      <LogOut size={20} />
                    </motion.span>
                    <span className="ml-3"></span>
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="flex items-center justify-center w-full px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium shadow-md hover:shadow-lg hover:scale-105 transition"
                  >
                    ➤
                  </Link>
                )}
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Navbar;
