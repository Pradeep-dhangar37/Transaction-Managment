import { useState, useEffect } from "react";
import axios from "axios";

export const TransactionHistory = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        type: '',
        startDate: '',
        endDate: '',
        minAmount: '',
        maxAmount: '',
        search: ''
    });

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const response = await axios.get('http://localhost:3000/api/v1/account/transactions', {
                headers: {
                    Authorization: "Bearer " + localStorage.getItem("token")
                }
            });
            setTransactions(response.data.transactions);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching transactions:", error);
            setLoading(false);
        }
    };

    const applyFilters = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            Object.keys(filters).forEach(key => {
                if (filters[key]) params.append(key, filters[key]);
            });

            const response = await axios.get(`http://localhost:3000/api/v1/me/transactions/filter?${params}`, {
                headers: {
                    Authorization: "Bearer " + localStorage.getItem("token")
                }
            });
            setTransactions(response.data.transactions);
            setLoading(false);
        } catch (error) {
            console.error("Error applying filters:", error);
            setLoading(false);
        }
    };

    const clearFilters = () => {
        setFilters({
            type: '',
            startDate: '',
            endDate: '',
            minAmount: '',
            maxAmount: '',
            search: ''
        });
        fetchTransactions();
    };

    const downloadReceipt = async (transactionId) => {
        try {
            const response = await axios.get(`http://localhost:3000/api/v1/me/receipt/${transactionId}`, {
                headers: {
                    Authorization: "Bearer " + localStorage.getItem("token")
                }
            });

            const receipt = `
PAYMENT RECEIPT
================
Receipt ID: ${response.data.receiptId}
Date: ${new Date(response.data.date).toLocaleString()}

FROM:
${response.data.from.name}
${response.data.from.email}

TO:
${response.data.to.name}
${response.data.to.email}

AMOUNT: ₹${response.data.amount}
STATUS: ${response.data.status}
TYPE: ${response.data.type}
${response.data.description ? `DESCRIPTION: ${response.data.description}` : ''}

================
Thank you for using PayTM
            `;

            const blob = new Blob([receipt], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `receipt-${transactionId}.txt`;
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            alert("Error downloading receipt");
        }
    };

    if (loading) {
        return <div className="text-center py-4">Loading transactions...</div>;
    }

    return (
        <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
                <div className="font-bold text-lg">Transaction History</div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                    {showFilters ? 'Hide Filters' : '🔍 Show Filters'}
                </button>
            </div>

            {showFilters && (
                <div className="bg-white rounded-lg shadow p-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Type</label>
                            <select
                                value={filters.type}
                                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                                className="w-full px-3 py-2 border rounded"
                            >
                                <option value="">All</option>
                                <option value="sent">Sent</option>
                                <option value="received">Received</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Start Date</label>
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                className="w-full px-3 py-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">End Date</label>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                className="w-full px-3 py-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Min Amount</label>
                            <input
                                type="number"
                                value={filters.minAmount}
                                onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                                placeholder="0"
                                className="w-full px-3 py-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Max Amount</label>
                            <input
                                type="number"
                                value={filters.maxAmount}
                                onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                                placeholder="10000"
                                className="w-full px-3 py-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Search Name</label>
                            <input
                                type="text"
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                placeholder="Search by name..."
                                className="w-full px-3 py-2 border rounded"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={applyFilters}
                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                        >
                            Apply Filters
                        </button>
                        <button
                            onClick={clearFilters}
                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg shadow">
                {transactions.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No transactions found</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">From/To</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {transactions.map((txn) => {
                                    const isSent = txn.fromUserId._id !== undefined;
                                    const otherUser = isSent ? txn.toUserId : txn.fromUserId;

                                    return (
                                        <tr key={txn._id}>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded text-xs ${isSent ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                                    }`}>
                                                    {isSent ? 'Sent' : 'Received'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {otherUser?.firstName} {otherUser?.lastName}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={isSent ? 'text-red-600' : 'text-green-600'}>
                                                    {isSent ? '-' : '+'}₹{txn.amount.toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded text-xs ${txn.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                        txn.status === 'reversed' ? 'bg-red-100 text-red-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {txn.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                {new Date(txn.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => downloadReceipt(txn._id)}
                                                    className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                                                    title="Download Receipt"
                                                >
                                                    📄 Receipt
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
