import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Appbar } from "../components/Appbar";

const RequestMoney = () => {
    const [activeTab, setActiveTab] = useState('create');
    const [users, setUsers] = useState([]);
    const [receivedRequests, setReceivedRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);
    const [selectedUser, setSelectedUser] = useState("");
    const [amount, setAmount] = useState("");
    const [message, setMessage] = useState("");
    const [searchFilter, setSearchFilter] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        fetchUsers();
        fetchRequests();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get('http://localhost:3000/api/v1/user/bulk', {
                headers: { Authorization: "Bearer " + token }
            });
            setUsers(response.data.user);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    const fetchRequests = async () => {
        try {
            const token = localStorage.getItem("token");
            const [received, sent] = await Promise.all([
                axios.get('http://localhost:3000/api/v1/me/requests/received', {
                    headers: { Authorization: "Bearer " + token }
                }),
                axios.get('http://localhost:3000/api/v1/me/requests/sent', {
                    headers: { Authorization: "Bearer " + token }
                })
            ]);
            setReceivedRequests(received.data.requests);
            setSentRequests(sent.data.requests);
        } catch (error) {
            console.error("Error fetching requests:", error);
        }
    };

    const handleCreateRequest = async () => {
        if (!selectedUser || !amount || amount <= 0) {
            alert("Please select a user and enter valid amount");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            await axios.post('http://localhost:3000/api/v1/me/request-money', {
                toUserId: selectedUser,
                amount: parseFloat(amount),
                message
            }, {
                headers: { Authorization: "Bearer " + token }
            });
            alert("Payment request sent successfully!");
            setSelectedUser("");
            setAmount("");
            setMessage("");
            fetchRequests();
            setActiveTab('sent');
        } catch (error) {
            alert(error.response?.data?.message || "Error creating request");
        }
    };

    const handleAcceptRequest = async (requestId) => {
        if (!confirm("Are you sure you want to accept this payment request?")) return;

        try {
            const token = localStorage.getItem("token");
            await axios.post('http://localhost:3000/api/v1/me/requests/accept', {
                requestId
            }, {
                headers: { Authorization: "Bearer " + token }
            });
            alert("Payment request accepted!");
            fetchRequests();
        } catch (error) {
            alert(error.response?.data?.message || "Error accepting request");
        }
    };

    const handleRejectRequest = async (requestId) => {
        if (!confirm("Are you sure you want to reject this payment request?")) return;

        try {
            const token = localStorage.getItem("token");
            await axios.post('http://localhost:3000/api/v1/me/requests/reject', {
                requestId
            }, {
                headers: { Authorization: "Bearer " + token }
            });
            alert("Payment request rejected");
            fetchRequests();
        } catch (error) {
            alert(error.response?.data?.message || "Error rejecting request");
        }
    };

    const filteredUsers = users.filter(user =>
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchFilter.toLowerCase())
    );

    return (
        <div>
            <Appbar />
            <div className="max-w-6xl mx-auto p-8">
                <h1 className="text-3xl font-bold mb-8">Request Money</h1>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow mb-6">
                    <div className="border-b">
                        <div className="flex">
                            <button
                                onClick={() => setActiveTab('create')}
                                className={`px-6 py-3 ${activeTab === 'create' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
                            >
                                Create Request
                            </button>
                            <button
                                onClick={() => setActiveTab('received')}
                                className={`px-6 py-3 ${activeTab === 'received' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
                            >
                                Received ({receivedRequests.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('sent')}
                                className={`px-6 py-3 ${activeTab === 'sent' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
                            >
                                Sent ({sentRequests.length})
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        {/* Create Request Tab */}
                        {activeTab === 'create' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Search User</label>
                                    <input
                                        type="text"
                                        placeholder="Search by name..."
                                        value={searchFilter}
                                        onChange={(e) => setSearchFilter(e.target.value)}
                                        className="w-full px-3 py-2 border rounded mb-2"
                                    />
                                    <select
                                        value={selectedUser}
                                        onChange={(e) => setSelectedUser(e.target.value)}
                                        className="w-full px-3 py-2 border rounded"
                                    >
                                        <option value="">Select a user</option>
                                        {filteredUsers.map(user => (
                                            <option key={user._id} value={user._id}>
                                                {user.firstName} {user.lastName} ({user.username})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Amount (₹)</label>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="Enter amount"
                                        className="w-full px-3 py-2 border rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Message (Optional)</label>
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Add a note..."
                                        className="w-full px-3 py-2 border rounded"
                                        rows="3"
                                    />
                                </div>
                                <button
                                    onClick={handleCreateRequest}
                                    className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                >
                                    Send Request
                                </button>
                            </div>
                        )}

                        {/* Received Requests Tab */}
                        {activeTab === 'received' && (
                            <div>
                                {receivedRequests.length === 0 ? (
                                    <p className="text-center text-gray-500 py-8">No pending requests</p>
                                ) : (
                                    <div className="space-y-4">
                                        {receivedRequests.map(request => (
                                            <div key={request._id} className="border rounded p-4 bg-yellow-50">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-semibold">
                                                            {request.fromUserId.firstName} {request.fromUserId.lastName}
                                                        </p>
                                                        <p className="text-sm text-gray-600">{request.fromUserId.username}</p>
                                                        <p className="text-2xl font-bold text-blue-600 mt-2">₹{request.amount}</p>
                                                        {request.message && (
                                                            <p className="text-sm text-gray-700 mt-2">"{request.message}"</p>
                                                        )}
                                                        <p className="text-xs text-gray-500 mt-2">
                                                            {new Date(request.createdAt).toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleAcceptRequest(request._id)}
                                                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                                        >
                                                            Accept
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectRequest(request._id)}
                                                            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Sent Requests Tab */}
                        {activeTab === 'sent' && (
                            <div>
                                {sentRequests.length === 0 ? (
                                    <p className="text-center text-gray-500 py-8">No sent requests</p>
                                ) : (
                                    <div className="space-y-4">
                                        {sentRequests.map(request => (
                                            <div key={request._id} className="border rounded p-4">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-semibold">
                                                            To: {request.toUserId.firstName} {request.toUserId.lastName}
                                                        </p>
                                                        <p className="text-sm text-gray-600">{request.toUserId.username}</p>
                                                        <p className="text-2xl font-bold text-blue-600 mt-2">₹{request.amount}</p>
                                                        {request.message && (
                                                            <p className="text-sm text-gray-700 mt-2">"{request.message}"</p>
                                                        )}
                                                        <p className="text-xs text-gray-500 mt-2">
                                                            {new Date(request.createdAt).toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className={`px-3 py-1 rounded text-sm ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                request.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                                                    'bg-red-100 text-red-800'
                                                            }`}>
                                                            {request.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <button
                    onClick={() => navigate('/dashboard')}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                    ← Back to Dashboard
                </button>
            </div>
        </div>
    );
};

export default RequestMoney;
