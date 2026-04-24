import mongoose from "mongoose";

const ReferralSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true
    },

    maxUses: {
      type: Number,
      required: true,
      default: 1
    },

    usedCount: {
      type: Number,
      default: 0
    },

    isActive: {
      type: Boolean,
      default: true
    },

    // OPTIONAL (VERY USEFUL FOR YOUR PROJECT)
    createdBy: {
      type: String, // admin name or ID
      default: "system"
    },

    school: {
      type: String, // helps identify where code came from
      default: ""
    },

    expiresAt: {
      type: Date // optional expiration date
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.models.Referral || mongoose.model("Referral", ReferralSchema);