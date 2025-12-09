import { useState, useEffect } from "react";
import axios from "axios";

export const Notifications = ({ onClose }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get('http://localhost:3000/api/v1/me/notifications', {
                headers: { Authorization: "Bearer " + token }
            });
            setNotifications(response.data.notifications);
            setUnreadCount(response.data.unreadCount);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            const token = localStorage.getItem("token");
            await axios.put(`http://localhost:3000/api/v1/me/notifications/${id}/read`, {}, {
                headers: { Authorization: "Bearer " + token }
            });
            fetchNotifications();
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const token = localStorage.getItem("token");
            await axios.put('http://localhost:3000/api/v1/me/notifications/read-all', {}, {
                headers: { Authorization: "Bearer " + token }
            });
            fetchNotifications();
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    return (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border z-50 max-h-96 overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
                <h3 className="font-semibold">Notifications ({unreadCount} unread)</h3>
                <div className="flex gap-2">
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllAsRead}
                            className="text-xs text-blue-500 hover:underline"
                        >
                            Mark all read
                        </button>
                    )}
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>
            </div>
            <div>
                {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No notifications yet
                    </div>
                ) : (
                    notifications.map((notif) => (
                        <div
                            key={notif._id}
                            className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${!notif.read ? 'bg-blue-50' : ''
                                }`}
                            onClick={() => !notif.read && handleMarkAsRead(notif._id)}
                        >
                            <div className="flex items-start">
                                <div className={`w-2 h-2 rounded-full mt-2 mr-3 ${!notif.read ? 'bg-blue-500' : 'bg-gray-300'
                                    }`}></div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs px-2 py-1 rounded ${notif.type === 'transaction' ? 'bg-green-100 text-green-800' :
                                                notif.type === 'request' ? 'bg-yellow-100 text-yellow-800' :
                                                    notif.type === 'alert' ? 'bg-red-100 text-red-800' :
                                                        'bg-blue-100 text-blue-800'
                                            }`}>
                                            {notif.type}
                                        </span>
                                    </div>
                                    <div className="font-semibold mt-1">{notif.title}</div>
                                    <div className="text-sm text-gray-600 mt-1">{notif.message}</div>
                                    <div className="text-xs text-gray-400 mt-2">
                                        {new Date(notif.createdAt).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
