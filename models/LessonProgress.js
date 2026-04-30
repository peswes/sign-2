import mongoose from "mongoose";

const lessonProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User"
  },

  courseId: {
    type: String,
    required: true
  },

  lessonIndex: {
    type: Number,
    required: true
  },

  videoCompleted: {
    type: Boolean,
    default: false
  },

  quizCompleted: {
    type: Boolean,
    default: false
  },

  assignmentCompleted: {
    type: Boolean,
    default: false
  },

  completed: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

export default mongoose.models.LessonProgress ||
mongoose.model("LessonProgress", lessonProgressSchema);