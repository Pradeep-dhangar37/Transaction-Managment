import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from "./pages/Dashboard";
import SendMoney from "./pages/SendMoney";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import AdminDashboard from "./pages/AdminDashboard";
import AdminSignIn from "./pages/AdminSignIn";
import Profile from "./pages/Profile";
import RequestMoney from "./pages/RequestMoney";
import Insights from "./pages/Insights";

// Protected Route Component
function ProtectedRoute({ children, requireAdmin = false }) {
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("userRole");

    if (!token) {
        return <Navigate to={requireAdmin ? "/admin-signin" : "/signin"} replace />;
    }

    if (requireAdmin && userRole !== 'admin') {
        return <Navigate to="/admin-signin" replace />;
    }

    return children;
}

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/signup" element={<SignUp />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/admin-signin" element={<AdminSignIn />} />
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute requireAdmin={true}>
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/send"
                    element={
                        <ProtectedRoute>
                            <SendMoney />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <Profile />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/request-money"
                    element={
                        <ProtectedRoute>
                            <RequestMoney />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/insights"
                    element={
                        <ProtectedRoute>
                            <Insights />
                        </ProtectedRoute>
                    }
                />
                <Route path="/" element={<Navigate to="/signin" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
