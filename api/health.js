export default function handler(req, res) {
  res.status(200).json({
    success: true,
    message: "Westkay Learning API is running 🚀",
  });
}