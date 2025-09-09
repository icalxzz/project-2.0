import React, { useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
} from "firebase/auth";
import {
  collection,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { auth, db } from "../../firebase";

const API_BASE =
  import.meta.env.DEV
    ? "http://localhost:5000" // saat development
    : "/.netlify/functions/server"; // saat di Netlify

export default function Dashboard() {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });
  const [error, setError] = useState("");

  const fetchUsers = async () => {
    const snapshot = await getDocs(collection(db, "users"));
    const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setUsers(list);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      let uid;

      const signInMethods = await fetchSignInMethodsForEmail(
        auth,
        newUser.email
      );

      if (signInMethods.length > 0) {
        const existingUser = users.find((u) => u.email === newUser.email);
        if (!existingUser)
          throw new Error(
            "Email sudah terdaftar di Auth, tapi tidak ada di Firestore."
          );
        uid = existingUser.id;

        await updateDoc(doc(db, "users", uid), {
          name: newUser.name,
          role: newUser.role,
          updatedAt: new Date(),
        });
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          newUser.email,
          newUser.password
        );
        uid = userCredential.user.uid;

        await setDoc(doc(db, "users", uid), {
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          createdAt: new Date(),
        });
      }

      try {
        await fetch(API_BASE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: uid,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
          }),
        });
      } catch (err) {
        console.warn("Gagal simpan ke backend:", err.message);
      }

      await fetchUsers();

      setNewUser({ name: "", email: "", password: "", role: "user" });
      setError("");
    } catch (err) {
      console.error("Error tambah user:", err);
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "users", id));
      setUsers(users.filter((u) => u.id !== id));

      await fetch(`${API_BASE}/${id}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Error deleting user:", err);
      setError(err.message);
    }
  };

  const handleRoleChange = async (id, role) => {
    await updateDoc(doc(db, "users", id), { role });
    setUsers(users.map((u) => (u.id === id ? { ...u, role } : u)));
  };

  return (
    <div className="bg-[#120F1D] min-h-screen text-white font-sans">
      <main className="p-4 sm:p-8 pt-24">
        {" "}
        {/* kasih padding top biar ga nempel navbar */}
        {/* Tambah User Section */}
        <div className="bg-[#1B192B] p-6 rounded-lg mb-6 shadow-md">
          <h2 className="text-lg font-bold mb-4 flex items-center text-gray-300">
            <span className="mr-2 text-yellow-500">
              <i className="fas fa-user-plus"></i>
            </span>
            Tambah User Manual
          </h2>
          {error && <p className="text-red-400 mb-4">{error}</p>}

          <form
            onSubmit={handleAdd}
            className="grid grid-cols-1 md:grid-cols-5 gap-4"
          >
            <div>
              <label className="block text-gray-400 text-sm mb-1">Name</label>
              <input
                type="text"
                placeholder="Name"
                value={newUser.name}
                onChange={(e) =>
                  setNewUser({ ...newUser, name: e.target.value })
                }
                required
                className="w-full bg-[#352F43] text-white placeholder-gray-500 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Email</label>
              <input
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
                required
                className="w-full bg-[#352F43] text-white placeholder-gray-500 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">
                Password
              </label>
              <input
                type="password"
                placeholder="Password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
                required
                className="w-full bg-[#352F43] text-white placeholder-gray-500 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Role</label>
              <select
                value={newUser.role}
                onChange={(e) =>
                  setNewUser({ ...newUser, role: e.target.value })
                }
                className="w-full bg-[#352F43] text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md transition-colors"
              >
                Tambah
              </button>
            </div>
          </form>
        </div>
        {/* User List Table */}
        <div className="bg-[#1B192B] p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Daftar User</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-[#352F43] text-left text-gray-300">
                  <th className="py-3 px-4 rounded-tl-lg">ID</th>
                  <th className="py-3 px-4">Nama</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 rounded-tr-lg">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, index) => (
                  <tr
                    key={u.id}
                    className="border-b border-gray-700 last:border-b-0"
                  >
                    <td className="py-3 px-4 text-gray-400">{index + 1}</td>
                    <td className="py-3 px-4">{u.name}</td>
                    <td className="py-3 px-4">{u.email}</td>
                    <td className="py-3 px-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className={`bg-[#352F43] text-white p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-md transition-colors"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
