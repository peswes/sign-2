import { connectDB } from "../../lib/db";
import Course from "../../models/Course";

export default async function handler(req, res) {
  try {
    await connectDB();

    // =========================
    // GET ALL COURSES
    // =========================
    if (req.method === "GET") {
      const courses = await Course.find({}).sort({ createdAt: -1 });

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

      // basic validation
      if (!courseName) {
        return res.status(400).json({
          success: false,
          message: "courseName is required",
        });
      }

      // check duplicate
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