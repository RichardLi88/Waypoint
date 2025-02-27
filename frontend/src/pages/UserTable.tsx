"use client";

import { useState } from "react";
import useAxios from "../hooks/useAxios";
import useAuth from "../hooks/useAuth";

type User = {
  _id: number;
  name: string;
  username: string;
  role: "admin" | "developer";
};

type UserTableProps = {
  users: User[];
  onUserDeleted: (deletedUser: User) => void;
};

export function UserTable({ users, onUserDeleted }: UserTableProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const { session } = useAuth() 
  const Axios = useAxios();

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    try {
      const response = await Axios.patch(
        `/api/users/${selectedUser?.username}/password`,
        {
          password: newPassword,
        }
      );

      if (response.status !== 200) {
        throw new Error("Failed to reset password");
      }

      setSuccess("Password reset successfully");
      setNewPassword("");
      setConfirmPassword("");
      setError(null);
      setTimeout(() => setShowModal(false), 2000);
    } catch {
      setError("Failed to reset password. Please try again.");
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (window.confirm(`Are you sure you want to delete ${user.name}?`)) {
      try {
        const response = await Axios.delete(`/api/users/${user.username}`);
        if (response.status === 200) {
          onUserDeleted(user);
          setSuccess(`User ${user.name} deleted successfully`);
        } else {
          throw new Error("Failed to delete user");
        }
      } catch {
        setError("Failed to delete user. Please try again.");
      }
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead>
          <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
            <th className="py-2 px-4 text-left">Name</th>
            <th className="py-2 px-4 text-left">Username</th>
            <th className="py-2 px-4 text-left">Role</th>
            <th className="py-2 px-4 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="text-gray-600 text-sm font-light">
          {users.map((user) => (
            <tr
              key={user._id}
              className="border-b border-gray-200 hover:bg-gray-100"
            >
              <td className="py-2 px-4 text-left whitespace-nowrap">
                {user.name}
              </td>
              <td className="py-2 px-4 text-left">{user.username}</td>
              <td className="py-2 px-4 text-left">{user.role}</td>
              <td className="py-2 px-4 text-center">
                <button
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
                  onClick={() => {
                    setSelectedUser(user);
                    setShowModal(true);
                  }}
                >
                  Reset Password
                </button>
                {user.username != session?.username && <button
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded my-2"
                  onClick={() => handleDeleteUser(user)}
                >
                  Delete
                </button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 h-full w-full"
          id="my-modal"
        >
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-end">
              <button
                className="text-gray-600 hover:text-gray-900"
                onClick={() => setShowModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Reset Password for {selectedUser?.name}
              </h3>
              <div className="mt-2 px-7 py-3">
                <input
                  type="password"
                  className="px-3 py-2 border rounded w-full mb-2"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <input
                  type="password"
                  className="px-3 py-2 border rounded w-full mb-2"
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {error && <p className="text-red-500 mb-2">{error}</p>}
                {/* {success && <p className="text-green-500 mb-2">{success}</p>} */}
              </div>
              <div className="items-center px-4 py-3">
                <button
                  id="ok-btn"
                  className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  onClick={handleResetPassword}
                >
                  Reset Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {(error || success) && !showModal && (
        <div className="mt-4 text-center">
          {error && <p className="text-red-500">{error}</p>}
          {success && <p className="text-green-500">{success}</p>}
        </div>
      )}
    </div>
  );
}
