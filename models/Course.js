import mongoose from "mongoose";

const MaterialSchema = new mongoose.Schema({
  icon: String,
  title: String,
  description: String,
  tags: [String],
  link: String,
});

const CourseSchema = new mongoose.Schema(
  {
    courseName: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    description: String,
    materials: [MaterialSchema],
  },
  { timestamps: true }
);

export default mongoose.models.Course ||
  mongoose.model("Course", CourseSchema);