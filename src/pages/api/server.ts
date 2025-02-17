require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const SHOTSTACK_API_KEY = process.env.SHOTSTACK_API_KEY;

// Function: Lấy ảnh sản phẩm từ Shopee
async function scrapeShopee(url) {
  try {
    const response = await axios.get(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    const $ = cheerio.load(response.data);
    const images = [];

    $("img").each((_, img) => {
      const src = $(img).attr("src");
      if (src && src.includes("shopeemobile.com")) images.push(src);
    });

    return images.slice(0, 5);
  } catch (error) {
    console.error("Error scraping Shopee:", error);
    return [];
  }
}

// API: Tạo video từ ảnh Shopee
app.post("/api/generate-video", async (req, res) => {
  const { productUrl } = req.body;
  if (!productUrl) return res.status(400).json({ error: "Missing product URL" });

  const images = await scrapeShopee(productUrl);
  console.log(images);
  if (images.length === 0) return res.status(400).json({ error: "No images found" });

  try {
    const videoRequest = {
      timeline: {
        tracks: [
          {
            clips: images.map((img, index) => ({
              asset: { type: "image", src: img },
              start: index * 3,
              length: 3,
              scale: "crop",
              transition: { in: "fade", out: "fade" }
            })),
          },
        ],
      },
      output: { format: "mp4", resolution: "hd" },
    };

    const shotstackResponse = await axios.post(
        "https://api.shotstack.io/v1/render",
        videoRequest,
        { headers: { "x-api-key": SHOTSTACK_API_KEY } }
    );

    return res.json({ renderId: shotstackResponse.data.response.id });
  } catch (error) {
    console.error("Error generating video:", error);
    res.status(500).json({ error: "Failed to generate video" });
  }
});

// API: Kiểm tra trạng thái video từ Shotstack
app.get("/api/video-status/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const response = await axios.get(`https://api.shotstack.io/v1/render/${id}`, {
      headers: { "x-api-key": SHOTSTACK_API_KEY },
    });

    if (response.data.response.status === "done") {
      return res.json({ videoUrl: response.data.response.url });
    } else {
      return res.json({ status: response.data.response.status });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch video status" });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));