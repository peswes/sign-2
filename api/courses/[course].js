import connectDB from "../../lib/db";
import Course from "../../models/Course";

export default async function handler(req, res) {
  try {
    // =========================
    // CORS (IMPORTANT FOR VERCEL FRONTEND)
    // =========================
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    await connectDB();

    const { course } = req.query;

    // =========================
    // GET ALL COURSES (no query)
    // =========================
    if (req.method === "GET" && !course) {
      const courses = await Course.find({}).sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        count: courses.length,
        courses,
      });
    }

    // =========================
    // GET SINGLE COURSE
    // =========================
    if (req.method === "GET" && course) {
      const found = await Course.findOne({
        courseName: decodeURIComponent(course),
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
    // CREATE COURSE
    // =========================
    if (req.method === "POST") {
      const { courseName, description, materials, uiHighlights, topics } = req.body;

      if (!courseName) {
        return res.status(400).json({
          success: false,
          message: "courseName is required",
        });
      }

      const exists = await Course.findOne({ courseName });

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

    // =========================
    // UPDATE COURSE
    // =========================
    if (req.method === "PUT") {
      const updated = await Course.findOneAndUpdate(
        { courseName: decodeURIComponent(course) },
        { $set: { ...req.body, updatedAt: new Date() } },
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
        courseName: decodeURIComponent(course),
      });

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
      message: "Server error",
      error: err.message,
    });
  }
}