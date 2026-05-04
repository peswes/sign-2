import connectDB from "../lib/db.js";
import Message from "../models/Message.js";

export default async function handler(req, res) {
  // =========================
  // 🌐 CORS SETUP
  // =========================
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // =========================
  // CONNECT DB
  // =========================
  await connectDB();

  // =========================
  // 🔐 ADMIN AUTH CHECK
  // =========================
  const token = req.headers.authorization;
  const ADMIN_TOKEN = "admin_secure_token_2026";

  if (!token || token !== ADMIN_TOKEN) {
    return res.status(403).json({
      success: false,
      message: "🚫 Unauthorized admin access"
    });
  }

  // =========================
  // GET ALL MESSAGES
  // =========================
  if (req.method === "GET") {
    try {
      const messages = await Message.find({})
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        count: messages.length,
        messages
      });

    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "❌ Failed to fetch messages",
        error: err.message
      });
    }
  }

  // =========================
  // METHOD NOT ALLOWED
  // =========================
  return res.status(405).json({
    success: false,
    message: "Method not allowed"
  });
}