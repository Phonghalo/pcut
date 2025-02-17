import { useState } from "react";
import axios from "axios";

export default function Home() {
    const [url, setUrl] = useState("");
    const [videoUrl, setVideoUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null);
    const [renderId, setRenderId] = useState(null);

    const handleGenerateVideo = async () => {
        if (!url) return;
        setLoading(true);
        setVideoUrl(null);
        setStatus("Processing...");

        try {
            const response = await axios.post("http://localhost:3000/api/generate-video", { productUrl: url });
            setRenderId(response.data.renderId);
            checkVideoStatus(response.data.renderId);
        } catch (error) {
            alert("Failed to generate video");
        }
    };

    const checkVideoStatus = async (id) => {
        const interval = setInterval(async () => {
            try {
                const response = await axios.get(`http://localhost:3000/api/video-status/${id}`);
                if (response.data.videoUrl) {
                    setVideoUrl(response.data.videoUrl);
                    setStatus("Completed!");
                    clearInterval(interval);
                } else {
                    setStatus(response.data.status);
                }
            } catch (error) {
                clearInterval(interval);
            }
        }, 5000);
    };

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">🎥 Generate Video from Shopee Product</h1>

            <input
                type="text"
                placeholder="Enter Shopee product URL..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="border p-2 w-full mb-4"
            />

            <button onClick={handleGenerateVideo} className="bg-blue-500 text-white p-2 rounded">
                {loading ? "Generating..." : "Generate Video"}
            </button>

            {status && <p className="mt-4">{status}</p>}

            {videoUrl && (
                <div className="mt-6">
                    <h2 className="text-xl font-semibold">Generated Video</h2>
                    <video controls src={videoUrl} className="w-full mt-2"></video>
                </div>
            )}
        </div>
    );
}