import { MongoClient, ObjectId } from "mongodb";
import jwt from "jsonwebtoken";

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {

  try {

    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token"
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    await client.connect();

    const db = client.db("westkay");
    const collection = db.collection("lessonProgress");

    /* =========================
       SAVE / UPDATE
    ========================= */

    if (req.method === "POST") {

      const {
        courseId,
        lessonIndex,
        videoCompleted,
        quizCompleted,
        assignmentCompleted,
        completed
      } = req.body;

      const existing = await collection.findOne({
        userId: new ObjectId(decoded.id),
        courseId,
        lessonIndex
      });

      if (existing) {

        await collection.updateOne(
          {
            _id: existing._id
          },
          {
            $set: {
              videoCompleted,
              quizCompleted,
              assignmentCompleted,
              completed,
              updatedAt: new Date()
            }
          }
        );

      } else {

        await collection.insertOne({
          userId: new ObjectId(decoded.id),
          courseId,
          lessonIndex,
          videoCompleted,
          quizCompleted,
          assignmentCompleted,
          completed,
          createdAt: new Date(),
          updatedAt: new Date()
        });

      }

      return res.status(200).json({
        success: true
      });
    }

    /* =========================
       GET USER PROGRESS
    ========================= */

    if (req.method === "GET") {

      const progress = await collection
        .find({
          userId: new ObjectId(decoded.id)
        })
        .toArray();

      return res.status(200).json({
        success: true,
        data: progress
      });
    }

    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });

  } catch (err) {

    console.log(err);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
}