import connectDB from "../lib/db.js";
import Message from "../models/Message.js";

export default async function handler(req, res) {
  await connectDB();

  const token = req.headers.authorization;

  if (token !== "admin_secure_token_2026") {
    return res.status(403).json({ error: "Unauthorized admin access" });
  }

  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
}