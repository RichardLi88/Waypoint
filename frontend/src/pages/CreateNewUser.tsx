"use client";

import { useState } from "react";
import useAxios from "../hooks/useAxios";

type User = {
  _id: number;
  name: string;
  username: string;
  role: "admin" | "developer";
};

type CreateUserFormProps = {
  onUserCreated: (user: User) => void;
};

export function CreateUserForm({ onUserCreated }: CreateUserFormProps) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "developer">("developer");
  const [passwordVerify, setPasswordVerify] = useState("");
  const [error, setError] = useState<string | null>(null);
  const Axios = useAxios();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !username || !password || !passwordVerify) {
      setError("All fields are required");
      return;
    }

    if (password !== passwordVerify) {
      setError("Passwords don't match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    try {
      await Axios.post("/api/users", {
        name,
        username,
        password,
        role,
      });

      const newUser = await Axios.get(`/api/users/${username}`);
      onUserCreated(newUser.data);
      setName("");
      setUsername("");
      setPassword("");
      setPasswordVerify("");
      setRole("developer");
    } catch {
      setError("Failed to create user. Please try again.");
    }
  };

  return (
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-xl font-semibold">Create New User</h2>
          <div>
            <input
              type="text"
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <input
              type="text"
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <input
              type="password"
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <input
              type="password"
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Verify Password"
              value={passwordVerify}
              onChange={(e) => setPasswordVerify(e.target.value)}
            />
          </div>
          <div>
            <select
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              value={role}
              onChange={(e) => setRole(e.target.value as "admin" | "developer")}
            >
              <option value="admin">Admin</option>
              <option value="developer">Developer</option>
            </select>
          </div>
          {error && <p className="text-red-500">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Create User
          </button>
        </form>
  );
}
