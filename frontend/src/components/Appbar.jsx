import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Notifications } from "./Notifications";
import axios from "axios";

export const Appbar = () => {
    const navigate = useNavigate();
    const userName = localStorage.getItem("userName") || "User";
    const userRole = localStorage.getItem("userRole");
    const firstLetter = userName.charAt(0).toUpperCase();
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000); // Check every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const fetchUnreadCount = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get('http://localhost:3000/api/v1/me/notifications', {
                headers: { Authorization: "Bearer " + token }
            });
            setUnreadCount(response.data.unreadCount);
        } catch (error) {
            console.error("Error fetching unread count:", error);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/signin');
    };

    return <div className="shadow h-14 flex justify-between relative">
        <div className="flex flex-col justify-center h-full ml-4">
            <span className="text-lg font-semibold cursor-pointer" onClick={() => navigate('/dashboard')}>
                PayTM App
            </span>
        </div>
        <div className="flex items-center gap-2">
            <button
                onClick={() => navigate('/insights')}
                className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
            >
                💡 Insights
            </button>
            <button
                onClick={() => navigate('/request-money')}
                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
            >
                💰 Request
            </button>
            <div className="relative">
                <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm relative"
                >
                    🔔 Notifications
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {unreadCount}
                        </span>
                    )}
                </button>
                {showNotifications && (
                    <Notifications onClose={() => {
                        setShowNotifications(false);
                        fetchUnreadCount();
                    }} />
                )}
            </div>
            <button
                onClick={() => navigate('/profile')}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
                👤 Profile
            </button>
            {userRole === 'admin' && (
                <button
                    onClick={() => navigate('/admin')}
                    className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
                >
                    Admin
                </button>
            )}
            <div className="flex flex-col justify-center h-full mr-2">
                <span className="text-sm">Hello, {userName.split(' ')[0]}</span>
            </div>
            <div className="rounded-full h-10 w-10 bg-slate-200 flex justify-center cursor-pointer" onClick={() => navigate('/profile')}>
                <div className="flex flex-col justify-center h-full text-lg">
                    {firstLetter}
                </div>
            </div>
            <button
                onClick={handleLogout}
                className="mr-4 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
            >
                Logout
            </button>
        </div>
    </div>
}