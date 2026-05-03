import connectDB from "../../lib/db";
import Course from "../../models/Course";

export default async function handler(req, res) {
  try {

    // CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,PUT,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    await connectDB();

    const { course } = req.query;

    if (!course) {
      return res.status(400).json({
        success: false,
        message: "Course name is required",
      });
    }

    // GET COURSE
    if (req.method === "GET") {
      const found = await Course.findOne({ courseName: course });

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
    }

    // UPDATE COURSE
    if (req.method === "PUT") {
      const updated = await Course.findOneAndUpdate(
        { courseName: course },
        { $set: req.body },
        { new: true, runValidators: true }
      );

      return res.status(200).json({
        success: true,
        course: updated,
      });
    }

    // DELETE COURSE
    if (req.method === "DELETE") {
      await Course.findOneAndDelete({ courseName: course });

      return res.status(200).json({
        success: true,
        message: "Course deleted",
      });
    }

    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}