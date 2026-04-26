import { MongoClient, ObjectId } from "mongodb";
import jwt from "jsonwebtoken";

const uri = process.env.MONGODB_URI;

/* =========================
   DB CACHE (VERCEL OPTIMIZED)
========================= */
let cachedDb = null;

async function connectDB() {
  if (cachedDb) return cachedDb;

  if (!uri) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  const client = new MongoClient(uri);
  await client.connect();

  cachedDb = client.db("test");

  console.log("✅ Connected to DB");
  return cachedDb;
}

/* =========================
   CORS
========================= */
function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

/* =========================
   XP CALCULATION ENGINE
========================= */
function calculateXP(score, totalQuestions, percent, assignmentQuality = 0, isFirstAttempt = false, timeSpent = 0) {
  let xpEarned = 0;
  
  // Base XP from quiz score (max 50 XP)
  const quizXP = Math.floor((score / totalQuestions) * 50);
  xpEarned += quizXP;
  
  // Bonus XP for passing (50% or higher)
  if (percent >= 50) {
    xpEarned += 10; // Passing bonus
  }
  
  // Bonus XP for excellent performance (80% or higher)
  if (percent >= 80) {
    xpEarned += 15; // Excellence bonus
  }
  
  // Perfect score bonus (100%)
  if (percent === 100) {
    xpEarned += 25; // Perfect score bonus
  }
  
  // Assignment quality bonus (for open-ended assignments)
  if (assignmentQuality > 0) {
    xpEarned += Math.floor(assignmentQuality * 0.5); // Quality bonus up to 25 XP
  }
  
  // First attempt bonus
  if (isFirstAttempt === true) {
    xpEarned += 20; // First attempt bonus
  }
  
  // Time bonus for completing quickly (under 5 minutes)
  if (timeSpent > 0 && timeSpent < 300 && percent >= 70) {
    xpEarned += 10; // Speed bonus
  }
  
  return Math.min(xpEarned, 150); // Cap at 150 XP per quiz
}

/* =========================
   GRADE CALCULATION
========================= */
function calculateGrade(score, totalQuestions, reflections = [], followups = []) {
  const percentage = (score / totalQuestions) * 100;
  
  let letterGrade = "F";
  let gradePoint = 0.0;
  
  if (percentage >= 90) {
    letterGrade = "A";
    gradePoint = 4.0;
  } else if (percentage >= 80) {
    letterGrade = "B";
    gradePoint = 3.0;
  } else if (percentage >= 70) {
    letterGrade = "C";
    gradePoint = 2.0;
  } else if (percentage >= 60) {
    letterGrade = "D";
    gradePoint = 1.0;
  } else {
    letterGrade = "F";
    gradePoint = 0.0;
  }
  
  // Adjust for reflection quality (optional)
  let reflectionBonus = 0;
  if (reflections && reflections.length > 0) {
    const avgReflectionLength = reflections.reduce((sum, r) => sum + (r?.length || 0), 0) / reflections.length;
    if (avgReflectionLength > 100) reflectionBonus = 5;
    else if (avgReflectionLength > 50) reflectionBonus = 3;
  }
  
  // Adjust for follow-up quality
  let followupBonus = 0;
  if (followups && followups.length > 0) {
    const avgFollowupLength = followups.reduce((sum, f) => sum + (f?.length || 0), 0) / followups.length;
    if (avgFollowupLength > 75) followupBonus = 5;
    else if (avgFollowupLength > 40) followupBonus = 3;
  }
  
  const finalPercentage = Math.min(percentage + reflectionBonus + followupBonus, 100);
  
  return {
    percentage: Math.round(finalPercentage),
    letterGrade,
    gradePoint,
    passed: finalPercentage >= 70,
    reflectionBonus,
    followupBonus
  };
}

/* =========================
   UPDATE USER LEVEL
========================= */
async function updateUserLevel(db, userId) {
  const user = await db.collection("users").findOne({ _id: userId });
  
  if (!user) return { level: 1, xp: 0, xpForNextLevel: 100 };
  
  const xp = user.xp || 0;
  
  // Level calculation: level = floor(xp / 100) + 1
  const newLevel = Math.floor(xp / 100) + 1;
  const xpForNextLevel = (newLevel * 100) - xp;
  
  if (user.level !== newLevel) {
    await db.collection("users").updateOne(
      { _id: userId },
      { 
        $set: { 
          level: newLevel,
          xpForNextLevel: xpForNextLevel
        }
      }
    );
  }
  
  return {
    level: newLevel,
    xp: xp,
    xpForNextLevel: xpForNextLevel
  };
}

/* =========================
   MAIN HANDLER
========================= */
export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    /* =========================
       AUTH
    ========================= */
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided"
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
        error: jwtError.message
      });
    }

    const userId = decoded?.user?.id || decoded?.id || decoded?.userId || decoded?._id;
    const email = decoded?.user?.email || decoded?.email;

    const db = await connectDB();

    /* =========================
       USER QUERY
    ========================= */
    let query = null;

    if (userId && ObjectId.isValid(userId)) {
      query = { _id: new ObjectId(userId) };
    } else if (email) {
      query = { email: email.toLowerCase().trim() };
    }

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Invalid user identification"
      });
    }

    const user = await db.collection("users").findOne(query);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    /* =========================
       GET REQUESTS
    ========================= */
    if (req.method === "GET") {
      const { mode, course, topic } = req.query;

      /* =========================
         CHECK SINGLE TOPIC STATUS
      ========================= */
      if (mode === "status" && course && topic !== undefined) {
        const existing = await db.collection("quiz_results").findOne({
          userId: user._id,
          course: course,
          topicIndex: Number(topic)
        });

        return res.json({
          success: true,
          completed: !!existing,
          score: existing?.score || 0,
          percent: existing?.percent || 0,
          xpEarned: existing?.xpEarned || 0,
          grade: existing?.grade || null,
          completedAt: existing?.createdAt || null
        });
      }

      /* =========================
         GET ALL RESULTS FOR A COURSE
      ========================= */
      if (course) {
        const results = await db.collection("quiz_results")
          .find({ userId: user._id, course: course })
          .sort({ createdAt: -1 })
          .toArray();

        const completedTopics = results.filter(r => r.status === "completed").length;
        const totalScore = results.reduce((sum, r) => sum + (r.score || 0), 0);
        const totalXP = results.reduce((sum, r) => sum + (r.xpEarned || 0), 0);
        
        return res.json({
          success: true,
          results: results,
          completedTopics: completedTopics,
          totalScore: totalScore,
          totalXP: totalXP,
          topicStatus: results.map(r => ({
            topicIndex: r.topicIndex,
            completed: r.status === "completed",
            score: r.percent,
            xpEarned: r.xpEarned
          }))
        });
      }

      /* =========================
         ANALYTICS - GET ALL RESULTS
      ========================= */
      const results = await db.collection("quiz_results")
        .find({ userId: user._id })
        .sort({ createdAt: -1 })
        .toArray();

      const totalQuizzes = results.length;
      const totalScore = results.reduce((sum, r) => sum + (r.score || 0), 0);
      const totalQuestions = results.reduce((sum, r) => sum + (r.totalQuestions || 0), 0);
      const totalXP = results.reduce((sum, r) => sum + (r.xpEarned || 0), 0);
      
      const percent = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
      
      // Get user level info
      const levelInfo = await updateUserLevel(db, user._id);
      
      // Course-specific stats
      const courseStats = {};
      results.forEach(result => {
        if (!courseStats[result.course]) {
          courseStats[result.course] = {
            completed: 0,
            totalScore: 0,
            totalQuestions: 0,
            xpEarned: 0
          };
        }
        courseStats[result.course].completed++;
        courseStats[result.course].totalScore += result.score || 0;
        courseStats[result.course].totalQuestions += result.totalQuestions || 0;
        courseStats[result.course].xpEarned += result.xpEarned || 0;
      });
      
      // Calculate completion percentage per course
      Object.keys(courseStats).forEach(course => {
        const stats = courseStats[course];
        stats.percentage = stats.totalQuestions > 0 
          ? Math.round((stats.totalScore / stats.totalQuestions) * 100) 
          : 0;
      });

      // Calculate achievements
      const achievements = [];
      if (totalQuizzes >= 5) achievements.push({ id: "quiz_5", name: "Quiz Enthusiast", earned: true });
      if (totalQuizzes >= 12) achievements.push({ id: "quiz_12", name: "Quiz Master", earned: true });
      if (totalXP >= 500) achievements.push({ id: "xp_500", name: "XP Collector", earned: true });
      if (totalXP >= 1000) achievements.push({ id: "xp_1000", name: "XP Legend", earned: true });

      return res.json({
        success: true,
        totalQuizzes,
        score: totalScore,
        total: totalQuestions,
        percent,
        totalXP,
        levelInfo,
        courseStats,
        achievements,
        recentResults: results.slice(0, 10) // Last 10 results
      });
    }

    /* =========================
       POST - SAVE QUIZ
    ========================= */
    if (req.method === "POST") {
      const {
        course,
        topicIndex,
        score = 0,
        totalQuestions = 0,
        percent = 0,
        answers = [],
        xpEarned: clientXPEarned,
        sessionId,
        status = "completed",
        reflections = [],
        followUpAnswers = [],
        assignmentCode = "",
        isFirstAttempt = false,
        timeSpent = 0, // in seconds
        allowResubmit = false
      } = req.body;

      if (!course || topicIndex === undefined) {
        return res.status(400).json({
          success: false,
          message: "Missing course or topicIndex"
        });
      }

      /* =========================
         🔒 STRONG ANTI-CHEAT CHECK
      ========================= */
      const existing = await db.collection("quiz_results").findOne({
        userId: user._id,
        course: course,
        topicIndex: Number(topicIndex)
      });

      if (existing && !allowResubmit) {
        return res.status(403).json({
          success: false,
          message: "Quiz already submitted. XP locked for this topic.",
          existingScore: existing.percent,
          existingXP: existing.xpEarned,
          completedAt: existing.createdAt
        });
      }

      /* =========================
         CALCULATE GRADE AND XP
      ========================= */
      // Calculate grade based on quiz answers
      const gradeInfo = calculateGrade(score, totalQuestions, reflections, followUpAnswers);
      
      // Calculate XP based on performance
      let xpEarned = clientXPEarned || 0;
      if (!clientXPEarned) {
        // Auto-calculate XP if client didn't send it
        const assignmentQuality = gradeInfo.percentage;
        xpEarned = calculateXP(score, totalQuestions, gradeInfo.percentage, assignmentQuality, isFirstAttempt, timeSpent);
        
        // Add reflection quality bonus
        if (reflections && reflections.length > 0) {
          const hasQualityReflections = reflections.some(r => r && r.length > 50);
          if (hasQualityReflections) xpEarned += 5;
        }
        
        // Add code quality bonus (basic length check)
        if (assignmentCode && assignmentCode.length > 200) {
          xpEarned += 10;
        }
      }
      
      // Cap XP at reasonable amount
      xpEarned = Math.min(xpEarned, 150);
      xpEarned = Math.max(xpEarned, 5); // Minimum XP

      /* =========================
         SAVE OR UPDATE QUIZ RESULT
      ========================= */
      const quizData = {
        userId: user._id,
        course: course,
        topicIndex: Number(topicIndex),
        sessionId: sessionId || null,
        score: Number(score),
        totalQuestions: Number(totalQuestions),
        percent: gradeInfo.percentage,
        answers: answers || [],
        reflections: reflections || [],
        followUpAnswers: followUpAnswers || [],
        assignmentCode: assignmentCode || "",
        xpEarned: xpEarned,
        grade: gradeInfo.letterGrade,
        gradePoint: gradeInfo.gradePoint,
        passed: gradeInfo.passed,
        status: status,
        timeSpent: timeSpent,
        isRetry: !!existing,
        retryCount: existing ? (existing.retryCount || 0) + 1 : 0,
        reflectionBonus: gradeInfo.reflectionBonus,
        followupBonus: gradeInfo.followupBonus,
        createdAt: existing ? existing.createdAt : new Date(),
        updatedAt: new Date()
      };
      
      let savedId;
      if (existing && allowResubmit) {
        // Update existing record (for resubmissions)
        await db.collection("quiz_results").updateOne(
          { _id: existing._id },
          { $set: quizData }
        );
        savedId = existing._id;
      } else if (!existing) {
        // Insert new record
        const insertResult = await db.collection("quiz_results").insertOne(quizData);
        savedId = insertResult.insertedId;
      } else {
        savedId = existing._id;
      }

      /* =========================
         ATOMIC XP UPDATE (NO CHEAT)
      ========================= */
      // Only add XP if it's a new submission or improved score
      let xpToAdd = xpEarned;
      if (existing && existing.xpEarned >= xpEarned && !allowResubmit) {
        xpToAdd = 0; // No XP if score didn't improve
      } else if (existing && allowResubmit) {
        xpToAdd = Math.max(0, xpEarned - (existing.xpEarned || 0)); // Only add improvement XP
      }
      
      let finalTotalXP = (user.xp || 0);
      
      if (xpToAdd > 0) {
        const updateResult = await db.collection("users").updateOne(
          { _id: user._id },
          {
            $inc: {
              xp: xpToAdd,
              totalScore: Number(score),
              totalQuestions: Number(totalQuestions),
              totalQuizzesCompleted: existing ? 0 : 1
            },
            $set: {
              lastActive: new Date(),
              lastQuizSession: sessionId || user.lastQuizSession,
              lastCourse: course,
              lastTopicIndex: topicIndex
            },
            $push: {
              quizHistory: {
                course,
                topicIndex,
                score: Number(score),
                percent: gradeInfo.percentage,
                xpEarned: xpToAdd,
                timestamp: new Date()
              }
            }
          }
        );
        
        finalTotalXP = (user.xp || 0) + xpToAdd;
      }

      /* =========================
         UPDATE USER LEVEL
      ========================= */
      const levelInfo = await updateUserLevel(db, user._id);

      /* =========================
         CHECK COURSE COMPLETION
      ========================= */
      // Get all completed topics for this course
      const courseResults = await db.collection("quiz_results")
        .find({ userId: user._id, course: course, status: "completed" })
        .toArray();
      
      const completedTopics = courseResults.length;
      const totalTopicsForCourse = 12; // Default for frontend courses
      
      const courseCompleted = completedTopics >= totalTopicsForCourse;

      /* =========================
         RESPONSE
      ========================= */
      return res.json({
        success: true,
        message: existing ? "Quiz updated successfully" : "Quiz saved successfully",
        xpEarned: xpToAdd,
        totalXP: finalTotalXP,
        grade: {
          score: score,
          total: totalQuestions,
          percent: gradeInfo.percentage,
          letterGrade: gradeInfo.letterGrade,
          passed: gradeInfo.passed,
          reflectionBonus: gradeInfo.reflectionBonus,
          followupBonus: gradeInfo.followupBonus
        },
        levelInfo: levelInfo,
        courseProgress: {
          completedTopics: completedTopics,
          totalTopics: totalTopicsForCourse,
          percentage: Math.round((completedTopics / totalTopicsForCourse) * 100),
          courseCompleted: courseCompleted
        },
        quizData: {
          id: savedId?.toString() || null,
          isRetry: !!existing,
          retryCount: existing ? (existing.retryCount || 0) + 1 : 0
        }
      });
    }

    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });

  } catch (err) {
    console.error("❌ QUIZ API ERROR:", err);

    // Handle specific JWT errors
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token"
      });
    }
    
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please login again."
      });
    }

    // Handle MongoDB connection errors
    if (err.name === "MongoNetworkError") {
      return res.status(503).json({
        success: false,
        message: "Database connection error. Please try again."
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? err.message : "Internal server error"
    });
  }
}