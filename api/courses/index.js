import { connectDB } from "../../lib/db";
import Course from "../../models/Course";

export default async function handler(req, res) {
  try {

    // =========================
    // CORS (IMPORTANT FIX)
    // =========================
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // Handle preflight request
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
        .lean(); // faster response

      return res.status(200).json({
        success: true,
        count: courses.length,
        courses,
      });
    }

    // =========================
    // CREATE NEW COURSE
    // =========================
    if (req.method === "POST") {
      const { courseName, description, materials } = req.body;

      // validation
      if (!courseName || courseName.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "courseName is required",
        });
      }

      // prevent duplicates
      const exists = await Course.findOne({ courseName });

      if (exists) {
        return res.status(409).json({
          success: false,
          message: "Course already exists",
        });
      }

      const course = await Course.create({
        courseName: courseName.trim(),
        description: description || "",
        materials: materials || [],
      });

      return res.status(201).json({
        success: true,
        message: "Course created successfully",
        course,
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
      message: "Server error",
      error: err.message,
    });
  }
}