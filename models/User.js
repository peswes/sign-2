import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    /* =========================
       BASIC INFO
    ========================= */
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    phone: {
      type: String,
      required: true
    },

    /* =========================
       AUTH
    ========================= */
    password: {
      type: String,
      required: true
    },

    /* =========================
       COURSE SYSTEM
    ========================= */
    course: {
      type: String,
      required: true,
      enum: [
        "frontend-development",
        "game-development",
        "robotics-ai",
        "creative-tech",
        "backend-development",
        "cybersecurity",
        "data-analysis",
        "finance-business"
      ]
    },

    /* =========================
       GAMIFICATION SYSTEM 🔥 (FIXED)
    ========================= */
    xp: {
      type: Number,
      default: 0
    },

    totalScore: {
      type: Number,
      default: 0
    },

    level: {
      type: Number,
      default: 1
    },

    /* =========================
       REFERRAL SYSTEM
    ========================= */
    referralCode: {
      type: String,
      default: null,
      uppercase: true,
      trim: true
    },

    accessType: {
      type: String,
      enum: ["free", "premium", "pro"],
      default: "free"
    },

    /* =========================
       VERIFICATION
    ========================= */
    isVerified: {
      type: Boolean,
      default: false
    },

    /* =========================
       PASSWORD RESET
    ========================= */
    resetToken: {
      type: String,
      default: null
    },

    resetTokenExpiry: {
      type: Date,
      default: null
    },

    resetRequestedAt: {
      type: Date,
      default: null
    },

    /* =========================
       PROGRESS TRACKING
    ========================= */
    progress: {
      type: Object,
      default: {
        "frontend-development": 0,
        "game-development": 0,
        "robotics-ai": 0,
        "creative-tech": 0,
        "backend-development": 0,
        "cybersecurity": 0,
        "data-analysis": 0,
        "finance-business": 0
      }
    },

    /* =========================
       LAST LOGIN
    ========================= */
    lastLogin: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

/* =========================
   EXPORT (Vercel SAFE)
========================= */
export default mongoose.models.User || mongoose.model("User", UserSchema);