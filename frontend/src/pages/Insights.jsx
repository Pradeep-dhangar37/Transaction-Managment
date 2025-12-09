import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Appbar } from "../components/Appbar";

const Insights = () => {
    const [insights, setInsights] = useState(null);
    const [categorySpending, setCategorySpending] = useState({});
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchInsights();
        fetchRecommendations();
    }, []);

    const fetchInsights = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get('http://localhost:3000/api/v1/me/insights', {
                headers: { Authorization: "Bearer " + token }
            });
            setInsights(response.data.insights);
            setCategorySpending(response.data.categorySpending);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching insights:", error);
            setLoading(false);
        }
    };

    const fetchRecommendations = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get('http://localhost:3000/api/v1/me/recommendations', {
                headers: { Authorization: "Bearer " + token }
            });
            setRecommendations(response.data.recommendations);
        } catch (error) {
            console.error("Error fetching recommendations:", error);
        }
    };

    if (loading) {
        return (
            <div>
                <Appbar />
                <div className="flex justify-center items-center h-screen">Loading insights...</div>
            </div>
        );
    }

    return (
        <div>
            <Appbar />
            <div className="max-w-7xl mx-auto p-8">
                <h1 className="text-3xl font-bold mb-8">💡 AI-Powered Insights</h1>

                {/* Alerts */}
                {insights?.alerts && insights.alerts.length > 0 && (
                    <div className="mb-6">
                        {insights.alerts.map((alert, idx) => (
                            <div key={idx} className={`p-4 rounded-lg mb-2 ${alert.severity === 'high' ? 'bg-red-100 border-red-500' :
                                    alert.severity === 'medium' ? 'bg-yellow-100 border-yellow-500' :
                                        'bg-blue-100 border-blue-500'
                                } border-l-4`}>
                                <div className="font-semibold">{alert.message}</div>
                                <div className="text-sm mt-1">{alert.action}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-gray-500 text-sm">Total Spent (This Month)</h3>
                        <p className="text-3xl font-bold text-red-600">₹{insights?.summary.totalSpent.toFixed(2)}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-gray-500 text-sm">Total Received</h3>
                        <p className="text-3xl font-bold text-green-600">₹{insights?.summary.totalReceived.toFixed(2)}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-gray-500 text-sm">Transactions</h3>
                        <p className="text-3xl font-bold">{insights?.summary.transactionCount}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-gray-500 text-sm">Average Transaction</h3>
                        <p className="text-3xl font-bold">₹{insights?.summary.avgTransactionAmount.toFixed(2)}</p>
                    </div>
                </div>

                {/* Trends */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">📈 Spending Trends</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <div className="text-sm text-gray-600">Trend</div>
                            <div className={`text-2xl font-bold ${insights?.trends.trend === 'increasing' ? 'text-red-600' :
                                    insights?.trends.trend === 'decreasing' ? 'text-green-600' :
                                        'text-gray-600'
                                }`}>
                                {insights?.trends.trend === 'increasing' ? '📈 Increasing' :
                                    insights?.trends.trend === 'decreasing' ? '📉 Decreasing' :
                                        '➡️ Stable'}
                            </div>
                            <div className="text-sm text-gray-500">
                                {insights?.trends.spendingChange}% vs last month
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Daily Average</div>
                            <div className="text-2xl font-bold">₹{insights?.trends.dailyAverage}</div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Predicted Monthly</div>
                            <div className="text-2xl font-bold">₹{insights?.predictions.predictedMonthlySpending}</div>
                            <div className="text-xs text-gray-500">
                                Confidence: {insights?.predictions.confidence}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recommendations */}
                {insights?.recommendations && insights.recommendations.length > 0 && (
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-4">💡 Recommendations</h2>
                        <div className="space-y-3">
                            {insights.recommendations.map((rec, idx) => (
                                <div key={idx} className={`p-4 rounded-lg ${rec.type === 'warning' ? 'bg-yellow-50 border-l-4 border-yellow-500' :
                                        rec.type === 'alert' ? 'bg-red-50 border-l-4 border-red-500' :
                                            rec.type === 'success' ? 'bg-green-50 border-l-4 border-green-500' :
                                                'bg-blue-50 border-l-4 border-blue-500'
                                    }`}>
                                    <div className="font-semibold">{rec.title}</div>
                                    <div className="text-sm mt-1">{rec.message}</div>
                                    <div className="text-xs text-gray-600 mt-2">→ {rec.action}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Category Spending */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">📊 Spending by Category</h2>
                    {Object.keys(categorySpending).length === 0 ? (
                        <p className="text-gray-500">No categorized transactions yet</p>
                    ) : (
                        <div className="space-y-3">
                            {Object.entries(categorySpending)
                                .sort((a, b) => b[1].total - a[1].total)
                                .map(([category, data]) => (
                                    <div key={category} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                        <div>
                                            <div className="font-semibold">{category}</div>
                                            <div className="text-sm text-gray-600">{data.count} transactions</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xl font-bold">₹{data.total.toFixed(2)}</div>
                                            <div className="text-sm text-gray-600">
                                                Avg: ₹{(data.total / data.count).toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>

                {/* Smart Recommendations */}
                {recommendations.length > 0 && (
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-4">🎯 Frequent Recipients</h2>
                        <div className="space-y-3">
                            {recommendations.map((rec, idx) => (
                                <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded hover:bg-gray-100">
                                    <div>
                                        <div className="font-semibold">
                                            {rec.user.firstName} {rec.user.lastName}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {rec.count} transactions • Avg: ₹{rec.avgAmount.toFixed(2)}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Last transaction: {rec.daysSinceLastTransaction} days ago
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/send?id=${rec.user._id}&name=${rec.user.firstName}`)}
                                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                    >
                                        Send Money
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

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

export default Insights;
