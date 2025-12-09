import { useEffect, useState } from "react"
import { Button } from "./Button"
import axios from "axios";
import { useNavigate } from "react-router-dom";
// import { use } from "../../../backend/routes/account";
export const Users = () => {
    // Replace with backend call
    const [users, setUsers] = useState([]);
    const [filter, setFilter] = useState("");

    useEffect(() => {
        axios.get('http://localhost:3000/api/v1/user/bulk?filter=' + filter)
            .then(response => {
                setUsers(response.data.user)
            })
    }, [filter])

    return <>
        <div className="font-bold mt-6 text-lg">
            Users
        </div>
        <div className="my-2">
            <input onChange={(e) => {
                setFilter(e.target.value)
            }} type="text" placeholder="Search users..." className="w-full px-2 py-1 border rounded border-slate-200"></input>
        </div>
        <div>
            {users.map(user => <User user={user} />)}
        </div>
    </>
}

function User({ user }) {
    const navigate = useNavigate();

    const handleAddToFavorites = async () => {
        const nickname = prompt("Enter a nickname (optional):");
        try {
            const token = localStorage.getItem("token");
            await axios.post('http://localhost:3000/api/v1/me/favorites', {
                favoriteUserId: user._id,
                nickname: nickname || ''
            }, {
                headers: { Authorization: "Bearer " + token }
            });
            alert("Added to favorites!");
            window.location.reload(); // Refresh to show in favorites
        } catch (error) {
            alert(error.response?.data?.message || "Error adding to favorites");
        }
    };

    return <div className="flex justify-between">
        <div className="flex">
            <div className="rounded-full h-12 w-12 bg-slate-200 flex justify-center mt-1 mr-2">
                <div className="flex flex-col justify-center h-full text-xl">
                    {user.firstName[0]}
                </div>
            </div>
            <div className="flex flex-col justify-center h-ful">
                <div>
                    {user.firstName} {user.lastName}
                </div>
            </div>
        </div>

        <div className="flex gap-2 flex-col justify-center h-ful">
            <div className="flex gap-2">
                <Button label={"Send Money"} onClick={(e) => {
                    navigate('/send?id=' + user._id + "&name=" + user.firstName)
                }} />
                <button
                    onClick={handleAddToFavorites}
                    className="px-4 py-2 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
                >
                    ⭐ Favorite
                </button>
            </div>
        </div>
    </div>
}