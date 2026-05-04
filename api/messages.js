import connectDB from "../lib/db.js";
import Message from "../models/Message.js";

export default async function handler(req, res) {
  await connectDB();

  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {

    // ================= GET MESSAGES =================
    if (req.method === "GET") {
      const { userId } = req.query;

      const messages = await Message.find(
        userId ? { userId } : {}
      ).sort({ createdAt: 1 });

      return res.status(200).json(messages);
    }

    // ================= POST MESSAGE =================
    if (req.method === "POST") {
      const { userId, text, sender } = req.body;

      if (!userId || !text) {
        return res.status(400).json({
          success: false,
          message: "Missing fields"
        });
      }

      const msg = await Message.create({
        userId,
        text,
        sender,
        createdAt: new Date()
      });

      return res.status(201).json(msg);
    }

    return res.status(405).json({ message: "Method not allowed" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}