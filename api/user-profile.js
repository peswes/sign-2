import connectDB from "./db.js";
import User from "./User.js";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get token from header
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Extract user ID from token
    const userId = decoded?.user?.id || decoded?.id || decoded?.userId;
    const email = decoded?.user?.email || decoded?.email;

    // Connect to database
    await connectDB();

    // Find user by ID or email
    let user = null;
    if (userId) {
      user = await User.findById(userId);
    }
    if (!user && email) {
      user = await User.findOne({ email: email.toLowerCase() });
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Course display names mapping
    const courseNames = {
      "frontend-development": "Frontend Development",
      "game-development": "Game Development",
      "robotics-ai": "Robotics & AI",
      "creative-tech": "Creative Technology",
      "backend-development": "Backend Development",
      "cybersecurity": "Cybersecurity",
      "data-analysis": "Data Analysis",
      "finance-business": "Finance & Business"
    };

    // Course topics based on user's enrolled course
    const courseTopicsData = {
      "frontend-development": [
        { id: 0, title: "🌐 HTML Fundamentals", description: "Learn the structure of web pages with semantic HTML" },
        { id: 1, title: "🎨 CSS Styling", description: "Master CSS selectors, properties, and responsive design" },
        { id: 2, title: "🧠 JavaScript Basics", description: "Variables, functions, loops, and DOM manipulation" },
        { id: 3, title: "⚛️ React Introduction", description: "Build interactive UIs with React components" },
        { id: 4, title: "📡 API Integration", description: "Fetch and display data from REST APIs" },
        { id: 5, title: "🎯 State Management", description: "Manage application state effectively" },
        { id: 6, title: "🚀 Routing & Navigation", description: "Implement client-side routing" },
        { id: 7, title: "⚡ Performance Optimization", description: "Optimize web performance" },
        { id: 8, title: "🔒 Authentication", description: "Implement login and protected routes" },
        { id: 9, title: "📱 Responsive Design", description: "Mobile-first responsive layouts" },
        { id: 10, title: "🚀 Deployment", description: "Deploy to production with Vercel/Netlify" },
        { id: 11, title: "🏆 Portfolio Project", description: "Build your professional portfolio" }
      ],
      "backend-development": [
        { id: 0, title: "⚙️ Server Basics", description: "Understand server-client architecture" },
        { id: 1, title: "🚀 Node.js Fundamentals", description: "Learn Node.js and NPM" },
        { id: 2, title: "🧩 Express.js Framework", description: "Build REST APIs with Express" },
        { id: 3, title: "🗄️ Database Integration", description: "Connect MongoDB/PostgreSQL" },
        { id: 4, title: "🔐 Authentication & JWT", description: "Implement secure authentication" },
        { id: 5, title: "📡 WebSockets", description: "Build real-time features" }
      ],
      "game-development": [
        { id: 0, title: "🎮 Game Loop", description: "Understand game architecture" },
        { id: 1, title: "🕹️ Input Handling", description: "Handle keyboard/mouse/touch" },
        { id: 2, title: "🎨 Sprite Animation", description: "Create and animate sprites" },
        { id: 3, title: "💥 Collision Detection", description: "Implement collision systems" }
      ],
      "robotics-ai": [
        { id: 0, title: "🤖 AI Fundamentals", description: "Basic AI concepts and history" },
        { id: 1, title: "🧠 Neural Networks", description: "Understand neural networks" },
        { id: 2, title: "📊 Machine Learning", description: "Introduction to ML" }
      ],
      "creative-tech": [
        { id: 0, title: "🎨 Creative Coding", description: "Learn p5.js and creative programming" },
        { id: 1, title: "🎵 Audio Visualisation", description: "Create music visualizations" }
      ],
      "cybersecurity": [
        { id: 0, title: "🔐 Security Basics", description: "Understand security fundamentals" },
        { id: 1, title: "🛡️ Web Security", description: "Protect against common web vulnerabilities" }
      ],
      "data-analysis": [
        { id: 0, title: "📊 Data Visualization", description: "Create charts and graphs" },
        { id: 1, title: "🐍 Python for Data", description: "Learn pandas and numpy" }
      ],
      "finance-business": [
        { id: 0, title: "💰 Financial Analysis", description: "Understand financial statements" },
        { id: 1, title: "📈 Investment Basics", description: "Learn investment principles" }
      ]
    };

    // Get topics for user's course
    const topics = courseTopicsData[user.course] || courseTopicsData["frontend-development"];

    // Get completed quizzes from database (you'll need a QuizResult model)
    let completedTopics = [];
    try {
      // If you have a QuizResult model, fetch completed topics
      const QuizResult = mongoose.models.QuizResult || null;
      if (QuizResult) {
        const completedQuizzes = await QuizResult.find({ 
          userId: user._id, 
          course: user.course,
          status: "completed" 
        });
        completedTopics = completedQuizzes.map(q => q.topicIndex);
      }
    } catch (err) {
      console.log("No QuizResult model found, using localStorage fallback");
    }

    // Return user profile data
    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        course: user.course,
        courseDisplayName: courseNames[user.course] || user.course,
        xp: user.xp || 0,
        level: user.level || 1,
        totalScore: user.totalScore || 0,
        accessType: user.accessType,
        isVerified: user.isVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      },
      course: {
        key: user.course,
        displayName: courseNames[user.course] || user.course,
        topics: topics,
        totalTopics: topics.length
      },
      progress: {
        completedTopics: completedTopics,
        totalTopics: topics.length,
        percentage: topics.length > 0 ? (completedTopics.length / topics.length) * 100 : 0
      }
    });

  } catch (error) {
    console.error("❌ User profile error:", error);
    
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }
    
    return res.status(500).json({ 
      error: "Failed to fetch user profile",
      details: error.message 
    });
  }
}