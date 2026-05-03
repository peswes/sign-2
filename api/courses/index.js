import connectDB from "../../lib/db";
import Course from "../../models/Course";

export default async function handler(req, res) {
  try {
    // =========================
    // CORS
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
    if (req.method === "GET" && !req.query.course) {
      const courses = await Course.find({})
        .sort({ createdAt: -1 })
        .lean();

      return res.status(200).json({
        success: true,
        count: courses.length,
        courses,
      });
    }

    // =========================
    // GET SINGLE COURSE (FIXED SMART MATCH)
    // =========================
    if (req.method === "GET" && req.query.course) {
      let courseQuery = req.query.course?.trim();

      if (!courseQuery) {
        return res.status(400).json({
          success: false,
          message: "Course is required",
        });
      }

      // Normalize helper
      const normalize = (str) =>
        str.toLowerCase().replace(/\s+/g, "-");

      // Try exact match first
      let course = await Course.findOne({
        courseName: courseQuery,
      });

      // Try slug match if not found
      if (!course) {
        course = await Course.findOne({
          courseName: new RegExp("^" + courseQuery + "$", "i"),
        });
      }

      // Try reverse match (slug style)
      if (!course) {
        const all = await Course.find({}).lean();

        course = all.find((c) => {
          return (
            normalize(c.courseName) === normalize(courseQuery)
          );
        });
      }

      if (!course) {
        return res.status(404).json({
          success: false,
          message: "Course not found",
        });
      }

      return res.status(200).json({
        success: true,
        course,
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

      courseName = courseName?.trim();

      if (!courseName) {
        return res.status(400).json({
          success: false,
          message: "courseName is required",
        });
      }

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