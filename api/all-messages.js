import connectDB from "../lib/db.js";
import Message from "../models/Message.js";

export default async function handler(req, res) {
  // =========================
  // 🌐 CORS HEADERS
  // =========================
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight request (VERY IMPORTANT)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  await connectDB();

  const token = req.headers.authorization;
  const ADMIN_TOKEN = "admin_secure_token_2026";

  if (!token || token !== ADMIN_TOKEN) {
    return res.status(403).json({
      success: false,
      message: "Unauthorized"
    });
  }

  if (req.method === "GET") {
    try {
      const messages = await Message.find({})
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        messages
      });

    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Server error"
      });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}