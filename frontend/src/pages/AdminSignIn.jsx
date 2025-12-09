import React, { useState } from 'react';
import Heading from '../components/Heading';
import SubHeading from '../components/SubHeading';
import InputBox from '../components/InputBox';
import { Button } from '../components/Button';
import { BottomWarning } from '../components/BottomWarning';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminSignIn = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
    const [errorMessage, setErrorMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSignIn = async () => {
        if (!username || !password) {
            setErrorMessage("Please enter both email and password");
            return;
        }

        setLoading(true);
        setErrorMessage("");

        try {
            console.log("Attempting admin login...");
            const response = await axios.post('http://localhost:3000/api/v1/user/signin', {
                username,
                password
            });

            console.log("Login response:", response.data);

            if (response.data.token) {
                if (response.data.role !== 'admin') {
                    setErrorMessage("Access denied. Admin credentials required.");
                    setLoading(false);
                    return;
                }

                localStorage.setItem("token", response.data.token);
                localStorage.setItem("userRole", response.data.role);
                localStorage.setItem("userName", response.data.firstName + " " + response.data.lastName);

                console.log("Navigating to admin dashboard...");

                // Use window.location for guaranteed redirect
                window.location.href = "/admin";
            } else {
                setErrorMessage("Login failed. No token received.");
                setLoading(false);
            }
        } catch (error) {
            console.error("Login error:", error);
            setErrorMessage(error.response?.data?.message || "Invalid credentials");
            setLoading(false);
        }
    };

    return (
        <>
            <div className="bg-slate-300 h-screen flex justify-center">
                <div className="flex flex-col justify-center">
                    <div className="rounded-lg bg-white w-80 text-center p-2 h-max px-4">
                        <Heading label={"Admin Sign In"} />
                        <SubHeading label={"Enter admin credentials to access dashboard"} />
                        <InputBox
                            onChange={e => setUsername(e.target.value)}
                            placeholder="admin@paytm.com"
                            label={"Email"}
                            onKeyPress={(e) => e.key === 'Enter' && handleSignIn()}
                        />
                        <InputBox
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Enter password"
                            label={"Password"}
                            type="password"
                            onKeyPress={(e) => e.key === 'Enter' && handleSignIn()}
                        />
                        {errorMessage && <p className="text-red-500 text-sm mt-2">{errorMessage}</p>}
                        <div className="pt-4">
                            <Button
                                label={loading ? "Signing in..." : "Sign in"}
                                onClick={handleSignIn}
                                disabled={loading}
                            />
                        </div>
                        <BottomWarning
                            label={"Regular user?"}
                            buttonText={"User Login"}
                            to={"/signin"}
                        />
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminSignIn;
