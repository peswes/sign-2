import { connectDB } from "../../../lib/db";
import Course from "../../../models/Course";

export default async function handler(req, res) {
  await connectDB();

  const { course } = req.query;

  // GET SINGLE COURSE
  if (req.method === "GET") {
    try {
      const found = await Course.findOne({
        courseName: course,
      });

      if (!found) {
        return res.status(404).json({
          success: false,
          message: "Course not found",
        });
      }

      return res.status(200).json({
        success: true,
        course: found,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }

  // UPDATE COURSE (ADD MATERIALS / EDIT COURSE)
  if (req.method === "PUT") {
    try {
      const updated = await Course.findOneAndUpdate(
        { courseName: course },
        { $set: req.body },
        { new: true }
      );

      return res.status(200).json({
        success: true,
        course: updated,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }

  // DELETE COURSE
  if (req.method === "DELETE") {
    try {
      await Course.findOneAndDelete({
        courseName: course,
      });

      return res.status(200).json({
        success: true,
        message: "Course deleted",
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