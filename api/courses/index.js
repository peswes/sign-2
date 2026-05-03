import { connectDB } from "../../../lib/db";
import Course from "../../../models/Course";

export default async function handler(req, res) {
  await connectDB();

  // GET ALL COURSES
  if (req.method === "GET") {
    try {
      const courses = await Course.find({});
      return res.status(200).json({
        success: true,
        courses,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }

  // CREATE COURSE
  if (req.method === "POST") {
    try {
      const course = await Course.create(req.body);

      return res.status(201).json({
        success: true,
        course,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }

  res.status(405).json({ message: "Method not allowed" });
}