import connectDB from "../../../lib/db";
import Course from "../../../models/Course";

export default async function handler(req, res) {
  try {
    // =========================
    // CORS
    // =========================
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
        message: "Course parameter is required",
      });
    }

    // =========================
    // NORMALIZER (CRITICAL FIX)
    // =========================
    const normalize = (str = "") =>
      str.toString().toLowerCase().trim().replace(/\s+/g, "-");

    const courseKey = normalize(decodeURIComponent(course));

    // =========================
    // GET SINGLE COURSE
    // =========================
    if (req.method === "GET") {
      const courses = await Course.find({}).lean();

      const found = courses.find((c) => {
        return normalize(c.courseName) === courseKey;
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
        {
          courseName: new RegExp("^" + decodeURIComponent(course) + "$", "i"),
        },
        {
          $set: {
            ...req.body,
            updatedAt: new Date(),
          },
        },
        { new: true }
      );

      return res.status(200).json({
        success: true,
        course: updated,
      });
    }

    // =========================
    // DELETE COURSE
    // =========================
    if (req.method === "DELETE") {
      await Course.findOneAndDelete({
        courseName: new RegExp("^" + decodeURIComponent(course) + "$", "i"),
      });

      return res.status(200).json({
        success: true,
        message: "Course deleted successfully",
      });
    }

    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });

  } catch (err) {
    console.error("COURSE [SLUG] ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
}