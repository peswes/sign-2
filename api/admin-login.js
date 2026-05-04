export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { password } = req.body;

  // 🔐 CHANGE THIS PASSWORD
  const ADMIN_PASSWORD = "tutor123";

  if (password === ADMIN_PASSWORD) {
    return res.status(200).json({
      success: true,
      token: "admin_secure_token_2026"
    });
  }

  return res.status(401).json({ success: false, message: "Wrong password" });
}