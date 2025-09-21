import React, { useEffect, useState } from "react";
import { auth } from "/2.0/src/firebase.js";
import { onAuthStateChanged } from "firebase/auth";

const API_BASE = import.meta.env.DEV
  ? "http://localhost:5000"
  : "/.netlify/functions/server";

export default function ControlPanel() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editUser, setEditUser] = useState(null);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    role: "user",
    siswaId: "",
  });

  // 🔹 Cek login + load users
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        await fetchUsers();
      } else {
        setUser(null);
        setUsers([]);
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/users`);
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("🔥 Error fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Create new user
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      const result = await res.json();
      if (res.ok) {
        alert("✅ User baru berhasil dibuat!");
        setNewUser({ email: "", password: "", role: "user", siswaId: "" });
        await fetchUsers();
      } else {
        alert("❌ Gagal membuat user: " + result.error);
      }
    } catch (err) {
      console.error(err);
      alert("🔥 Server error saat create user");
    }
  };

  // 🔹 Update role / siswaId
  const handleUpdate = async (uid) => {
    try {
      const res = await fetch(`${API_BASE}/users/${uid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: editUser.role,
          siswaId: editUser.siswaId,
        }),
      });

      if (res.ok) {
        alert("✅ Data user berhasil diupdate");
        setUsers(users.map((u) => (u.uid === uid ? { ...u, ...editUser } : u)));
        setEditUser(null);
      } else {
        const err = await res.json();
        alert("❌ Gagal update: " + err.error);
      }
    } catch (err) {
      console.error(err);
      alert("🔥 Server error saat update user");
    }
  };

  // 🔹 Delete user
  const handleDelete = async (uid) => {
    if (!window.confirm("Hapus user ini?")) return;
    try {
      const res = await fetch(`${API_BASE}/users/${uid}`, { method: "DELETE" });
      if (res.ok) {
        setUsers(users.filter((u) => u.uid !== uid));
        alert("✅ User berhasil dihapus");
      } else {
        const err = await res.json();
        alert("❌ Gagal hapus: " + err.error);
      }
    } catch (err) {
      console.error(err);
      alert("🔥 Server error saat hapus user");
    }
  };

  if (loading) return <p className="p-8 text-center text-gray-400">Loading...</p>;

  return (
    <div className="bg-gray-900 text-gray-100 min-h-screen font-sans">
      <div className="container mx-auto p-4 md:p-6 lg:p-12">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-6 mt-8 text-white text-center">
          Admin Panel
        </h1>

        {!user ? (
          <p className="text-center text-lg text-gray-400">
            Please login to access the admin panel.
          </p>
        ) : (
          <>
            <div className="grid lg:grid-cols-3 gap-8">
              {/* 🔹 Form Create User */}
              <div className="lg:col-span-1 bg-gray-800 p-5 rounded-2xl shadow-2xl h-fit">
                <h2 className="text-xl md:text-2xl font-bold mb-5 text-white">
                  Create New User
                </h2>
                <form
                  onSubmit={handleCreateUser}
                  className="space-y-4 text-gray-300"
                >
                  <div className="space-y-1">
                    <label htmlFor="email" className="text-sm">Email</label>
                    <input
                      type="email"
                      id="email"
                      value={newUser.email}
                      onChange={(e) =>
                        setNewUser({ ...newUser, email: e.target.value })
                      }
                      required
                      className="w-full p-2 text-sm rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="password" className="text-sm">Password</label>
                    <input
                      type="password"
                      id="password"
                      value={newUser.password}
                      onChange={(e) =>
                        setNewUser({ ...newUser, password: e.target.value })
                      }
                      required
                      className="w-full p-2 text-sm rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="role" className="text-sm">Role</label>
                    <select
                      id="role"
                      value={newUser.role}
                      onChange={(e) =>
                        setNewUser({ ...newUser, role: e.target.value })
                      }
                      className="w-full p-2 text-sm rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="siswaId" className="text-sm">Siswa ID</label>
                    <input
                      type="text"
                      id="siswaId"
                      value={newUser.siswaId}
                      onChange={(e) =>
                        setNewUser({ ...newUser, siswaId: e.target.value })
                      }
                      className="w-full p-2 text-sm rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition-colors duration-200"
                  >
                    Create User
                  </button>
                </form>
              </div>

              {/* 🔹 List User */}
              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-xl md:text-2xl font-bold mb-4 text-white">User List</h2>
                <div className="space-y-4">
                  {users.map((u) => (
                    <div
                      key={u.uid}
                      className="bg-gray-800 p-5 rounded-2xl shadow-lg border border-gray-700 transition-transform duration-200 hover:scale-[1.01]"
                    >
                      {editUser?.uid === u.uid ? (
                        <div className="space-y-4">
                          <p className="text-base font-semibold text-gray-300">
                            Email: <span className="text-white font-normal">{u.email}</span>
                          </p>
                          <div>
                            <label htmlFor="edit-role" className="block text-gray-400 mb-1 text-sm">
                              Role
                            </label>
                            <select
                              id="edit-role"
                              value={editUser.role}
                              onChange={(e) =>
                                setEditUser({ ...editUser, role: e.target.value })
                              }
                              className="w-full p-2 text-sm rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>
                          <div>
                            <label htmlFor="edit-siswaId" className="block text-gray-400 mb-1 text-sm">
                              Siswa ID
                            </label>
                            <input
                              type="text"
                              id="edit-siswaId"
                              value={editUser.siswaId || ""}
                              onChange={(e) =>
                                setEditUser({ ...editUser, siswaId: e.target.value })
                              }
                              className="w-full p-2 text-sm rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div className="mt-4 flex gap-2 flex-col md:flex-row">
                            <button
                              onClick={() => handleUpdate(u.uid)}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition-colors duration-200"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditUser(null)}
                              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 rounded-lg transition-colors duration-200"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col md:flex-row md:items-center justify-between">
                          <div className="mb-4 md:mb-0">
                            <p className="text-base font-semibold text-white">
                              {u.email}
                            </p>
                            <p className="text-xs text-gray-400">
                              Role: <span className="font-semibold text-gray-200">{u.role}</span>
                            </p>
                            <p className="text-xs text-gray-400">
                              Siswa ID:{" "}
                              <span className="font-semibold text-gray-200">
                                {u.siswaId || "-"}
                              </span>
                            </p>
                          </div>
                          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto mt-2 sm:mt-0">
                            <button
                              onClick={() => setEditUser(u)}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors duration-200 w-full"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(u.uid)}
                              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors duration-200 w-full"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}