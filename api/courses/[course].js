import { connectDB } from "../../lib/db";
import Course from "../../models/Course";

export default async function handler(req, res) {
  try {
    // =========================
    // CORS HEADERS (IMPORTANT FIX)
    // =========================
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,PUT,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // Handle preflight request (VERY IMPORTANT)
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

    // =========================
    // GET SINGLE COURSE
    // =========================
    if (req.method === "GET") {
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
    }

    // =========================
    // UPDATE COURSE
    // =========================
    if (req.method === "PUT") {
      const updated = await Course.findOneAndUpdate(
        { courseName: course },
        { $set: req.body },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Course not found to update",
        });
      }

      return res.status(200).json({
        success: true,
        course: updated,
      });
    }

    // =========================
    // DELETE COURSE
    // =========================
    if (req.method === "DELETE") {
      const deleted = await Course.findOneAndDelete({
        courseName: course,
      });

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Course not found to delete",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Course deleted successfully",
      });
    }

    // =========================
    // METHOD NOT ALLOWED
    // =========================
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