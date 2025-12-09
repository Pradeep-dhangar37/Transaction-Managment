import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
    const [stats, setStats] = useState({});
    const [users, setUsers] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [flaggedTransactions, setFlaggedTransactions] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem("token");
            const [statsRes, usersRes, transactionsRes, flaggedRes, logsRes] = await Promise.all([
                axios.get('http://localhost:3000/api/v1/admin/stats', {
                    headers: { Authorization: "Bearer " + token }
                }),
                axios.get('http://localhost:3000/api/v1/admin/users', {
                    headers: { Authorization: "Bearer " + token }
                }),
                axios.get('http://localhost:3000/api/v1/admin/transactions?limit=10', {
                    headers: { Authorization: "Bearer " + token }
                }),
                axios.get('http://localhost:3000/api/v1/admin/transactions/flagged', {
                    headers: { Authorization: "Bearer " + token }
                }).catch(() => ({ data: { transactions: [] } })),
                axios.get('http://localhost:3000/api/v1/admin/logs', {
                    headers: { Authorization: "Bearer " + token }
                }).catch(() => ({ data: { logs: [] } }))
            ]);

            setStats(statsRes.data);
            setUsers(usersRes.data.users);
            setTransactions(transactionsRes.data.transactions);
            setFlaggedTransactions(flaggedRes.data.transactions || []);
            setLogs(logsRes.data.logs || []);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching admin data:", error);
            if (error.response?.status === 403) {
                alert("Access denied. Admin only.");
                navigate('/dashboard');
            }
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate('/signin');
    };

    const handleUpdateBalance = async (userId, action) => {
        const amount = prompt(`Enter amount to ${action}:`);
        if (!amount || isNaN(amount)) return;

        try {
            const token = localStorage.getItem("token");
            await axios.post('http://localhost:3000/api/v1/admin/update-balance', {
                userId,
                amount: parseFloat(amount),
                action
            }, {
                headers: { Authorization: "Bearer " + token }
            });
            alert("Balance updated successfully");
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || "Error updating balance");
        }
    };

    const handleReverseTransaction = async (transactionId) => {
        if (!confirm("Are you sure you want to reverse this transaction?")) return;

        try {
            const token = localStorage.getItem("token");
            await axios.post('http://localhost:3000/api/v1/admin/reverse-transaction', {
                transactionId
            }, {
                headers: { Authorization: "Bearer " + token }
            });
            alert("Transaction reversed successfully");
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || "Error reversing transaction");
        }
    };

    // HIGH PRIORITY FEATURES
    const handleSuspendUser = async (userId, suspend) => {
        if (!confirm(`Are you sure you want to ${suspend ? 'suspend' : 'unsuspend'} this user?`)) return;

        try {
            const token = localStorage.getItem("token");
            await axios.post('http://localhost:3000/api/v1/admin/user/suspend', {
                userId,
                suspend
            }, {
                headers: { Authorization: "Bearer " + token }
            });
            alert(`User ${suspend ? 'suspended' : 'unsuspended'} successfully`);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || "Error updating user status");
        }
    };

    const handleSetLimit = async (userId) => {
        const limit = prompt("Enter new daily transaction limit:");
        if (!limit || isNaN(limit)) return;

        try {
            const token = localStorage.getItem("token");
            await axios.post('http://localhost:3000/api/v1/admin/user/set-limit', {
                userId,
                dailyLimit: parseFloat(limit)
            }, {
                headers: { Authorization: "Bearer " + token }
            });
            alert("Transaction limit updated successfully");
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || "Error setting limit");
        }
    };

    const handleFlagTransaction = async (transactionId, flag) => {
        const reason = flag ? prompt("Enter reason for flagging:") : "";
        if (flag && !reason) return;

        try {
            const token = localStorage.getItem("token");
            await axios.post('http://localhost:3000/api/v1/admin/transaction/flag', {
                transactionId,
                flag,
                reason
            }, {
                headers: { Authorization: "Bearer " + token }
            });
            alert(`Transaction ${flag ? 'flagged' : 'unflagged'} successfully`);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || "Error flagging transaction");
        }
    };

    const handleExportCSV = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get('http://localhost:3000/api/v1/admin/export/transactions', {
                headers: { Authorization: "Bearer " + token },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'transactions.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
            alert("Transactions exported successfully!");
        } catch (error) {
            alert("Error exporting transactions");
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={handleExportCSV}
                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                        >
                            📥 Export CSV
                        </button>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-gray-500 text-sm">Total Users</h3>
                        <p className="text-3xl font-bold">{stats.totalUsers}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-gray-500 text-sm">Total Transactions</h3>
                        <p className="text-3xl font-bold">{stats.totalTransactions}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-gray-500 text-sm">Total Volume</h3>
                        <p className="text-3xl font-bold">₹{stats.totalVolume?.toFixed(2)}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-gray-500 text-sm">Flagged Transactions</h3>
                        <p className="text-3xl font-bold text-red-600">{flaggedTransactions.length}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow">
                    <div className="border-b overflow-x-auto">
                        <div className="flex">
                            {['overview', 'users', 'transactions', 'flagged', 'logs'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-6 py-3 whitespace-nowrap ${activeTab === tab ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs">From</th>
                                                <th className="px-4 py-2 text-left text-xs">To</th>
                                                <th className="px-4 py-2 text-left text-xs">Amount</th>
                                                <th className="px-4 py-2 text-left text-xs">Status</th>
                                                <th className="px-4 py-2 text-left text-xs">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stats.recentTransactions?.map((txn) => (
                                                <tr key={txn._id} className="border-b">
                                                    <td className="px-4 py-2 text-sm">{txn.fromUserId?.firstName} {txn.fromUserId?.lastName}</td>
                                                    <td className="px-4 py-2 text-sm">{txn.toUserId?.firstName} {txn.toUserId?.lastName}</td>
                                                    <td className="px-4 py-2 text-sm">₹{txn.amount}</td>
                                                    <td className="px-4 py-2">
                                                        <span className={`px-2 py-1 rounded text-xs ${txn.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                                txn.status === 'reversed' ? 'bg-red-100 text-red-800' :
                                                                    txn.status === 'flagged' ? 'bg-orange-100 text-orange-800' :
                                                                        'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                            {txn.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2 text-sm">{new Date(txn.createdAt).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Users Tab */}
                        {activeTab === 'users' && (
                            <div>
                                <h3 className="text-lg font-semibold mb-4">All Users</h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs">Name</th>
                                                <th className="px-4 py-2 text-left text-xs">Email</th>
                                                <th className="px-4 py-2 text-left text-xs">Balance</th>
                                                <th className="px-4 py-2 text-left text-xs">Status</th>
                                                <th className="px-4 py-2 text-left text-xs">Daily Limit</th>
                                                <th className="px-4 py-2 text-left text-xs">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map((user) => (
                                                <tr key={user._id} className="border-b">
                                                    <td className="px-4 py-2">{user.firstName} {user.lastName}</td>
                                                    <td className="px-4 py-2">{user.username}</td>
                                                    <td className="px-4 py-2">₹{user.balance?.toFixed(2)}</td>
                                                    <td className="px-4 py-2">
                                                        <span className={`px-2 py-1 rounded text-xs ${user.status === 'active' ? 'bg-green-100 text-green-800' :
                                                                user.status === 'suspended' ? 'bg-red-100 text-red-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {user.status || 'active'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2">₹{user.dailyLimit || 50000}</td>
                                                    <td className="px-4 py-2">
                                                        <div className="flex flex-wrap gap-1">
                                                            <button
                                                                onClick={() => handleUpdateBalance(user._id, 'add')}
                                                                className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                                                            >
                                                                Add
                                                            </button>
                                                            <button
                                                                onClick={() => handleUpdateBalance(user._id, 'deduct')}
                                                                className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                                                            >
                                                                Deduct
                                                            </button>
                                                            <button
                                                                onClick={() => handleSuspendUser(user._id, user.status !== 'suspended')}
                                                                className={`px-2 py-1 text-white rounded text-xs ${user.status === 'suspended' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-orange-500 hover:bg-orange-600'
                                                                    }`}
                                                            >
                                                                {user.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
                                                            </button>
                                                            <button
                                                                onClick={() => handleSetLimit(user._id)}
                                                                className="px-2 py-1 bg-purple-500 text-white rounded text-xs hover:bg-purple-600"
                                                            >
                                                                Set Limit
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Transactions Tab */}
                        {activeTab === 'transactions' && (
                            <div>
                                <h3 className="text-lg font-semibold mb-4">All Transactions</h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs">From</th>
                                                <th className="px-4 py-2 text-left text-xs">To</th>
                                                <th className="px-4 py-2 text-left text-xs">Amount</th>
                                                <th className="px-4 py-2 text-left text-xs">Type</th>
                                                <th className="px-4 py-2 text-left text-xs">Status</th>
                                                <th className="px-4 py-2 text-left text-xs">Date</th>
                                                <th className="px-4 py-2 text-left text-xs">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {transactions.map((txn) => (
                                                <tr key={txn._id} className="border-b">
                                                    <td className="px-4 py-2">{txn.fromUserId?.firstName} {txn.fromUserId?.lastName}</td>
                                                    <td className="px-4 py-2">{txn.toUserId?.firstName} {txn.toUserId?.lastName}</td>
                                                    <td className="px-4 py-2">₹{txn.amount}</td>
                                                    <td className="px-4 py-2">{txn.type}</td>
                                                    <td className="px-4 py-2">
                                                        <span className={`px-2 py-1 rounded text-xs ${txn.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                                txn.status === 'reversed' ? 'bg-red-100 text-red-800' :
                                                                    txn.status === 'flagged' ? 'bg-orange-100 text-orange-800' :
                                                                        'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                            {txn.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2">{new Date(txn.createdAt).toLocaleString()}</td>
                                                    <td className="px-4 py-2">
                                                        <div className="flex gap-1">
                                                            {txn.status === 'completed' && (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleReverseTransaction(txn._id)}
                                                                        className="px-2 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600"
                                                                    >
                                                                        Reverse
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleFlagTransaction(txn._id, !txn.flagged)}
                                                                        className="px-2 py-1 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600"
                                                                    >
                                                                        Flag
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Flagged Transactions Tab */}
                        {activeTab === 'flagged' && (
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Flagged Transactions</h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs">From</th>
                                                <th className="px-4 py-2 text-left text-xs">To</th>
                                                <th className="px-4 py-2 text-left text-xs">Amount</th>
                                                <th className="px-4 py-2 text-left text-xs">Reason</th>
                                                <th className="px-4 py-2 text-left text-xs">Date</th>
                                                <th className="px-4 py-2 text-left text-xs">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {flaggedTransactions.map((txn) => (
                                                <tr key={txn._id} className="border-b bg-orange-50">
                                                    <td className="px-4 py-2">{txn.fromUserId?.firstName} {txn.fromUserId?.lastName}</td>
                                                    <td className="px-4 py-2">{txn.toUserId?.firstName} {txn.toUserId?.lastName}</td>
                                                    <td className="px-4 py-2">₹{txn.amount}</td>
                                                    <td className="px-4 py-2">{txn.flagReason || 'N/A'}</td>
                                                    <td className="px-4 py-2">{new Date(txn.createdAt).toLocaleString()}</td>
                                                    <td className="px-4 py-2">
                                                        <button
                                                            onClick={() => handleFlagTransaction(txn._id, false)}
                                                            className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                                                        >
                                                            Unflag
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {flaggedTransactions.length === 0 && (
                                        <p className="text-center py-4 text-gray-500">No flagged transactions</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Admin Logs Tab */}
                        {activeTab === 'logs' && (
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Admin Activity Logs</h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs">Admin</th>
                                                <th className="px-4 py-2 text-left text-xs">Action</th>
                                                <th className="px-4 py-2 text-left text-xs">Target User</th>
                                                <th className="px-4 py-2 text-left text-xs">Details</th>
                                                <th className="px-4 py-2 text-left text-xs">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {logs.map((log) => (
                                                <tr key={log._id} className="border-b">
                                                    <td className="px-4 py-2">{log.adminId?.firstName} {log.adminId?.lastName}</td>
                                                    <td className="px-4 py-2">
                                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                                            {log.action}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        {log.targetUserId ? `${log.targetUserId.firstName} ${log.targetUserId.lastName}` : 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-2">{log.details}</td>
                                                    <td className="px-4 py-2">{new Date(log.createdAt).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {logs.length === 0 && (
                                        <p className="text-center py-4 text-gray-500">No admin logs yet</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
