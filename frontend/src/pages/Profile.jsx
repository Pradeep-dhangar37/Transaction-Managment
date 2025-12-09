import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Appbar } from "../components/Appbar";

const Profile = () => {
    const [profile, setProfile] = useState({});
    const [editing, setEditing] = useState(false);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get('http://localhost:3000/api/v1/me/profile', {
                headers: { Authorization: "Bearer " + token }
            });
            setProfile(response.data);
            setFirstName(response.data.user.firstName);
            setLastName(response.data.user.lastName);
        } catch (error) {
            console.error("Error fetching profile:", error);
        }
    };

    const handleUpdateProfile = async () => {
        try {
            const token = localStorage.getItem("token");
            await axios.put('http://localhost:3000/api/v1/me/profile', {
                firstName,
                lastName
            }, {
                headers: { Authorization: "Bearer " + token }
            });
            alert("Profile updated successfully");
            setEditing(false);
            fetchProfile();
            localStorage.setItem("userName", firstName + " " + lastName);
        } catch (error) {
            alert("Error updating profile");
        }
    };

    const handleChangePassword = async () => {
        if (newPassword.length < 6) {
            alert("Password must be at least 6 characters");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            await axios.post('http://localhost:3000/api/v1/me/change-password', {
                oldPassword,
                newPassword
            }, {
                headers: { Authorization: "Bearer " + token }
            });
            alert("Password changed successfully");
            setShowPasswordChange(false);
            setOldPassword("");
            setNewPassword("");
        } catch (error) {
            alert(error.response?.data?.message || "Error changing password");
        }
    };

    return (
        <div>
            <Appbar />
            <div className="max-w-4xl mx-auto p-8">
                <h1 className="text-3xl font-bold mb-8">My Profile</h1>

                {/* Profile Info Card */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Personal Information</h2>
                        {!editing && (
                            <button
                                onClick={() => setEditing(true)}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                Edit
                            </button>
                        )}
                    </div>

                    {editing ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">First Name</label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full px-3 py-2 border rounded"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Last Name</label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full px-3 py-2 border rounded"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleUpdateProfile}
                                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => setEditing(false)}
                                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div>
                                <span className="text-gray-600">Name:</span>
                                <span className="ml-2 font-medium">{profile.user?.firstName} {profile.user?.lastName}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Email:</span>
                                <span className="ml-2 font-medium">{profile.user?.username}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Account Status:</span>
                                <span className={`ml-2 px-2 py-1 rounded text-xs ${profile.user?.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                    {profile.user?.status || 'active'}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Account Details Card */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Account Details</h2>
                    <div className="space-y-3">
                        <div>
                            <span className="text-gray-600">Current Balance:</span>
                            <span className="ml-2 font-bold text-2xl text-green-600">₹{profile.balance?.toFixed(2)}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Daily Transaction Limit:</span>
                            <span className="ml-2 font-medium">₹{profile.dailyLimit?.toFixed(2)}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Today's Spent:</span>
                            <span className="ml-2 font-medium">₹{profile.dailySpent?.toFixed(2)}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Remaining Today:</span>
                            <span className="ml-2 font-medium text-blue-600">
                                ₹{((profile.dailyLimit || 0) - (profile.dailySpent || 0)).toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Security Card */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Security</h2>

                    {!showPasswordChange ? (
                        <button
                            onClick={() => setShowPasswordChange(true)}
                            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                        >
                            Change Password
                        </button>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Old Password</label>
                                <input
                                    type="password"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    className="w-full px-3 py-2 border rounded"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-3 py-2 border rounded"
                                    placeholder="Min 6 characters"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleChangePassword}
                                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                >
                                    Update Password
                                </button>
                                <button
                                    onClick={() => {
                                        setShowPasswordChange(false);
                                        setOldPassword("");
                                        setNewPassword("");
                                    }}
                                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Back Button */}
                <div className="mt-6">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                    >
                        ← Back to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Profile;
