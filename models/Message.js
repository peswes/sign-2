import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },

    text: {
      type: String,
      required: true,
    },

    sender: {
      type: String,
      enum: ["user", "tutor"],
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Message ||
  mongoose.model("Message", MessageSchema);