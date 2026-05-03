/**
 * /api/lesson-progress.js
 *
 * Vercel Serverless Function — handles ALL lesson flow state.
 *
 * ─────────────────────────────────────────────────────────────
 *  GET  /api/lesson-progress?courseId=javascript&lessonIndex=0
 *       → returns one lesson's flow state for the authed user
 *
 *  GET  /api/lesson-progress?courseId=javascript&all=true
 *       → returns ALL lessons' states for the authed user + course
 *         as a map: { "0": { videoCompleted, quizCompleted, ... }, ... }
 *
 *  POST /api/lesson-progress
 *       body: { courseId, lessonIndex, step, value }
 *       step  = "videoCompleted" | "quizCompleted" |
 *               "assignmentCompleted" | "completed"
 *       value = true | false
 *       → upserts the field, returns the full updated document
 * ─────────────────────────────────────────────────────────────
 */

import { connectDB }    from "../lib/db.js";
import LessonProgress   from "../models/LessonProgress.js";
import jwt              from "jsonwebtoken";

const VALID_STEPS = [
  "videoCompleted",
  "quizCompleted",
  "assignmentCompleted",
  "completed",
];

/* ── Auth helper ─────────────────────────────────────────── */
function getUserId(req) {
  const authHeader = req.headers["authorization"] || "";
  const token      = authHeader.split(" ")[1];
  if (!token) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return payload.id || payload._id || payload.userId;
  } catch {
    return null;
  }
}

/* ── Shape a Mongoose doc into a clean response object ────── */
function shapeDoc(doc) {
  return {
    courseId:            doc.courseId,
    lessonIndex:         doc.lessonIndex,
    videoCompleted:      doc.videoCompleted      ?? false,
    quizCompleted:       doc.quizCompleted       ?? false,
    assignmentCompleted: doc.assignmentCompleted ?? false,
    completed:           doc.completed           ?? false,
  };
}

/* ── Empty state (when no DB record exists yet) ──────────── */
function emptyState(courseId, lessonIndex) {
  return {
    courseId,
    lessonIndex:         Number(lessonIndex),
    videoCompleted:      false,
    quizCompleted:       false,
    assignmentCompleted: false,
    completed:           false,
  };
}

/* ══════════════════════════════════════════════════════════
   MAIN HANDLER
══════════════════════════════════════════════════════════ */
export default async function handler(req, res) {
  /* ── CORS ─────────────────────────────────────────────── */
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  /* ── Auth ─────────────────────────────────────────────── */
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  await connectDB();

  /* ════════════════════════════════════════════════════════
     GET
  ════════════════════════════════════════════════════════ */
  if (req.method === "GET") {
    const { courseId, lessonIndex, all } = req.query;

    if (!courseId) {
      return res.status(400).json({ success: false, error: "courseId required" });
    }

    /* ── GET ALL: ?courseId=xxx&all=true ─────────────────── */
    if (all === "true") {
      const docs = await LessonProgress.find({ userId, courseId })
        .sort({ lessonIndex: 1 })
        .lean();

      const map = {};
      docs.forEach((d) => {
        map[d.lessonIndex] = shapeDoc(d);
      });

      return res.status(200).json({ success: true, courseId, flow: map });
    }

    /* ── GET ONE: ?courseId=xxx&lessonIndex=0 ────────────── */
    if (lessonIndex === undefined || lessonIndex === null || lessonIndex === "") {
      return res.status(400).json({ success: false, error: "lessonIndex required" });
    }

    const doc = await LessonProgress.findOne({
      userId,
      courseId,
      lessonIndex: Number(lessonIndex),
    }).lean();

    const state = doc ? shapeDoc(doc) : emptyState(courseId, lessonIndex);
    return res.status(200).json({ success: true, ...state });
  }

  /* ════════════════════════════════════════════════════════
     POST  { courseId, lessonIndex, step, value }
  ════════════════════════════════════════════════════════ */
  if (req.method === "POST") {
    const { courseId, lessonIndex, step, value } = req.body;

    /* ── Validate ─────────────────────────────────────────── */
    if (!courseId || lessonIndex === undefined || lessonIndex === null) {
      return res.status(400).json({ success: false, error: "courseId and lessonIndex required" });
    }

    if (!step) {
      return res.status(400).json({ success: false, error: "step required" });
    }

    if (!VALID_STEPS.includes(step)) {
      return res.status(400).json({
        success: false,
        error:   `step must be one of: ${VALID_STEPS.join(", ")}`,
      });
    }

    /* ── Business rules: enforce the video→quiz→assignment order ── */
    if (step === "quizCompleted" && value === true) {
      const existing = await LessonProgress.findOne({
        userId, courseId, lessonIndex: Number(lessonIndex),
      }).lean();
      if (!existing?.videoCompleted) {
        return res.status(400).json({
          success: false,
          error:   "Cannot mark quiz complete — video not watched yet",
        });
      }
    }

    if (step === "assignmentCompleted" && value === true) {
      const existing = await LessonProgress.findOne({
        userId, courseId, lessonIndex: Number(lessonIndex),
      }).lean();
      if (!existing?.quizCompleted) {
        return res.status(400).json({
          success: false,
          error:   "Cannot mark assignment complete — quiz not passed yet",
        });
      }
    }

    if (step === "completed" && value === true) {
      const existing = await LessonProgress.findOne({
        userId, courseId, lessonIndex: Number(lessonIndex),
      }).lean();
      if (!existing?.videoCompleted || !existing?.quizCompleted || !existing?.assignmentCompleted) {
        return res.status(400).json({
          success: false,
          error:   "Complete video, quiz, and assignment before marking lesson done",
        });
      }
    }

    /* ── Upsert ───────────────────────────────────────────── */
    const updated = await LessonProgress.findOneAndUpdate(
      { userId, courseId, lessonIndex: Number(lessonIndex) },
      {
        $set: { [step]: value === true || value === "true" },
        $setOnInsert: {
          userId,
          courseId,
          lessonIndex: Number(lessonIndex),
        },
      },
      { upsert: true, new: true, lean: true }
    );

    return res.status(200).json({ success: true, ...shapeDoc(updated) });
  }

  /* ── Method not allowed ───────────────────────────────── */
  return res.status(405).json({ success: false, error: "Method not allowed" });
}