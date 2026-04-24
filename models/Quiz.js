import mongoose from "mongoose";

/* =========================
   QUESTION SCHEMA (FIXED)
========================= */
const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true
  },

  options: {
    type: [String],
    required: true,
    validate: {
      validator: (arr) => Array.isArray(arr) && arr.length >= 2,
      message: "At least 2 options are required"
    }
  },

  answer: {
    type: Number,
    required: true,
    validate: {
      validator: function (v) {
        return v >= 0 && this.options && v < this.options.length;
      },
      message: "Answer index must match options length"
    }
  },

  explanation: {
    type: String,
    default: ""
  }
}, { _id: false });

/* =========================
   ATTEMPT SCHEMA (IMPROVED)
========================= */
const attemptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },

  score: {
    type: Number,
    required: true,
    min: 0
  },

  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },

  passed: {
    type: Boolean,
    default: false
  },

  takenAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

/* =========================
   QUIZ SCHEMA
========================= */
const quizSchema = new mongoose.Schema({

  courseId: {
    type: String,
    required: true,
    index: true,
    trim: true
  },

  topicIndex: {
    type: Number,
    required: true,
    index: true
  },

  title: {
    type: String,
    default: "Topic Quiz",
    trim: true
  },

  questions: {
    type: [questionSchema],
    default: []
  },

  allowRetake: {
    type: Boolean,
    default: false
  },

  requiresVideoCompletion: {
    type: Boolean,
    default: true
  },

  passMark: {
    type: Number,
    default: 70,
    min: 1,
    max: 100
  },

  /* =========================
     ATTEMPTS (AUTO TRIM SAFE)
  ========================= */
  attempts: {
    type: [attemptSchema],
    default: []
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

/* =========================
   AUTO LIMIT ATTEMPTS (KEEP LAST 20)
========================= */
quizSchema.pre("save", function (next) {
  if (this.attempts.length > 20) {
    this.attempts = this.attempts.slice(-20);
  }
  next();
});

/* =========================
   VIRTUALS
========================= */
quizSchema.virtual("totalQuestions").get(function () {
  return this.questions.length;
});

quizSchema.virtual("totalAttempts").get(function () {
  return this.attempts.length;
});

/* =========================
   INDEX (UNIQUE QUIZ PER TOPIC)
========================= */
quizSchema.index({ courseId: 1, topicIndex: 1 }, { unique: true });

/* =========================
   SAFE OUTPUT
========================= */
quizSchema.set("toJSON", { virtuals: true });
quizSchema.set("toObject", { virtuals: true });

export default mongoose.models.Quiz ||
  mongoose.model("Quiz", quizSchema);