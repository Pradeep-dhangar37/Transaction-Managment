import { useState, useEffect } from "react";
import { Appbar } from "../components/Appbar";
import { Balance } from "../components/Balance";
import { Users } from "../components/Users";
import { TransactionHistory } from "../components/TransactionHistory";
import { Favorites } from "../components/Favorites";
import axios from "axios";

const Dashboard = () => {
    const [amount, setAmount] = useState("");

    useEffect(() => {
        axios.get('http://localhost:3000/api/v1/account/balance', {
            headers: {
                Authorization: "Bearer " + localStorage.getItem("token")
            }
        })
            .then(response => {
                const res = response.data.balance;
                setAmount(res);
            })
            .catch(error => {
                console.error("Error fetching balance:", error);
            });
    }, []);

    return (
        <div>
            <Appbar />
            <div className="m-8">
                <Balance value={amount} />
                <Favorites />
                <Users />
                <TransactionHistory />
            </div>
        </div>
    );
}

export default Dashboard;
