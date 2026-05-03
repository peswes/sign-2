import connectDB from "../lib/db.js";
import Referral from "../models/Referral.js";

const setCorsHeaders = (res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
};

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await connectDB();

    let { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Referral code is required" });
    }

    // ✅ CLEAN + NORMALIZE INPUT
    const cleanCode = code.trim().toUpperCase();

    // ✅ SAFE SEARCH (CASE INSENSITIVE)
    const ref = await Referral.findOne({
      code: { $regex: `^${cleanCode}$`, $options: "i" }
    });

    if (!ref) {
      return res.status(400).json({ message: "Invalid referral code" });
    }

    if (!ref.isActive) {
      return res.status(400).json({ message: "Code is inactive" });
    }

    if (ref.usedCount >= ref.maxUses) {
      return res.status(400).json({ message: "Code expired" });
    }

    return res.status(200).json({
      message: "Valid code",
      valid: true
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}