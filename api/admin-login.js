export default function handler(req, res) {
  // =========================
  // 🌐 CORS HEADERS
  // =========================
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // =========================
  // METHOD CHECK
  // =========================
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  try {
    // =========================
    // SAFE BODY PARSE
    // =========================
    const { password } = req.body || {};

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required"
      });
    }

    // =========================
    // 🔐 ADMIN PASSWORD
    // =========================
    const ADMIN_PASSWORD = "tutor123";

    // =========================
    // AUTH CHECK
    // =========================
    if (password === ADMIN_PASSWORD) {
      return res.status(200).json({
        success: true,
        message: "Login successful",
        token: "admin_secure_token_2026"
      });
    }

    return res.status(401).json({
      success: false,
      message: "Wrong password"
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
}