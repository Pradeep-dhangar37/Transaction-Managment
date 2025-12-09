import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export const Favorites = () => {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchFavorites();
    }, []);

    const fetchFavorites = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get('http://localhost:3000/api/v1/me/favorites', {
                headers: { Authorization: "Bearer " + token }
            });
            setFavorites(response.data.favorites);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching favorites:", error);
            setLoading(false);
        }
    };

    const handleRemoveFavorite = async (favoriteUserId) => {
        if (!confirm("Remove from favorites?")) return;

        try {
            const token = localStorage.getItem("token");
            await axios.delete(`http://localhost:3000/api/v1/me/favorites/${favoriteUserId}`, {
                headers: { Authorization: "Bearer " + token }
            });
            fetchFavorites();
        } catch (error) {
            alert("Error removing favorite");
        }
    };

    const handleSendMoney = (userId, name) => {
        navigate(`/send?id=${userId}&name=${name}`);
    };

    if (loading) return <div className="text-center py-4">Loading favorites...</div>;

    if (favorites.length === 0) {
        return (
            <div className="mt-8">
                <div className="font-bold text-lg mb-4">⭐ Favorites</div>
                <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                    No favorites yet. Add users to favorites for quick access!
                </div>
            </div>
        );
    }

    return (
        <div className="mt-8">
            <div className="font-bold text-lg mb-4">⭐ Favorites</div>
            <div className="bg-white rounded-lg shadow">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                    {favorites.map((fav) => (
                        <div key={fav._id} className="border rounded-lg p-4 hover:shadow-md transition">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center">
                                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl mr-3">
                                        {fav.favoriteUserId.firstName[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-semibold">
                                            {fav.nickname || `${fav.favoriteUserId.firstName} ${fav.favoriteUserId.lastName}`}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {fav.favoriteUserId.username}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleSendMoney(
                                        fav.favoriteUserId._id,
                                        `${fav.favoriteUserId.firstName} ${fav.favoriteUserId.lastName}`
                                    )}
                                    className="flex-1 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                                >
                                    Send Money
                                </button>
                                <button
                                    onClick={() => handleRemoveFavorite(fav.favoriteUserId._id)}
                                    className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
