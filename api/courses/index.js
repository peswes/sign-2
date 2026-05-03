import connectDB from "../../lib/db";
import Course from "../../models/Course";

export default async function handler(req, res) {
  try {
    // =========================
    // CORS (Vercel-safe)
    // =========================
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    await connectDB();

    // =========================
    // GET ALL COURSES
    // =========================
    if (req.method === "GET") {
      const courses = await Course.find({})
        .sort({ createdAt: -1 })
        .lean(); // improves performance

      return res.status(200).json({
        success: true,
        count: courses.length,
        courses,
      });
    }

    // =========================
    // CREATE COURSE
    // =========================
    if (req.method === "POST") {
      let {
        courseName,
        description,
        materials,
        uiHighlights,
        topics,
      } = req.body;

      // normalize input
      courseName = courseName?.trim();

      if (!courseName) {
        return res.status(400).json({
          success: false,
          message: "courseName is required",
        });
      }

      // prevent duplicates (case-insensitive safe match)
      const exists = await Course.findOne({
        courseName: new RegExp("^" + courseName + "$", "i"),
      });

      if (exists) {
        return res.status(409).json({
          success: false,
          message: "Course already exists",
        });
      }

      const course = await Course.create({
        courseName,
        description: description || "",
        materials: materials || [],
        uiHighlights: uiHighlights || [],
        topics: topics || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return res.status(201).json({
        success: true,
        message: "Course created successfully",
        course,
      });
    }

    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });

  } catch (err) {
    console.error("COURSE API ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
}