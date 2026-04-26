export default function handler(req, res) {
  // =========================
  // CORS SETUP
  // =========================
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS, GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  // Support GET for demo content
  if (req.method === "GET") {
    return handleGetRequest(req, res);
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { courseKey, lesson, previousSubmission, getDemoAnswers } = req.body;

  if (!courseKey || !lesson?.id) {
    return res.status(400).json({ message: "Missing courseKey or lesson" });
  }

  const lessonId = Number(lesson.id);
  const lessonTitle = lesson.title || "Untitled Lesson";
  const hasPreviousWork = previousSubmission && previousSubmission.code;
  const wantDemoAnswers = getDemoAnswers === true;

  // =========================
  // DEMO ANSWERS FOR STUDENTS (Quality examples)
  // =========================
  const demoAnswers = {
    demoReflections: [
      "I chose this approach because it provides a clean, maintainable structure that separates concerns. Using semantic HTML and modern CSS techniques ensures the code is both readable and performant. The component-based thinking helps with scalability and makes the code easier to debug and maintain in the long run.",
      "The main challenge was making the layout responsive across different devices. I solved this by using CSS Grid for the overall structure and Flexbox for component alignment. Media queries helped fine-tune the breakpoints for mobile, tablet, and desktop views. Testing on real devices helped identify edge cases.",
      "Next time I would add more interactive features using JavaScript, implement dark mode for better user experience, and optimize images for faster loading. I'd also add unit tests to ensure reliability, implement lazy loading for better performance, and consider using a CSS framework for faster development."
    ],
    demoFollowups: [
      "The most important concept was understanding how the browser renders pages and how CSS layout algorithms work. This knowledge helps debug layout issues and create more efficient designs. Understanding the box model, positioning contexts, and stacking contexts has been crucial for creating complex layouts.",
      "I would apply this by building a complete portfolio website for a client, ensuring it's accessible, performant, and responsive. The same principles apply to e-commerce sites, web applications, and content-heavy websites. Using proper semantic HTML improves SEO and accessibility.",
      "Next, I want to learn about advanced JavaScript frameworks like React, state management with Redux, and backend integration with Node.js. I'm also interested in learning about web performance optimization, Core Web Vitals, and progressive web apps (PWAs)."
    ],
    demoTemplate: getBaseDemoTemplate()
  };

  // =========================
  // COMPLETE ASSIGNMENTS DATABASE
  // =========================
  const assignments = getAssignmentsDatabase(demoAnswers, hasPreviousWork);

  // =========================
  // GET ENHANCED ASSIGNMENT
  // =========================
  const course = assignments[courseKey];
  const selectedAssignment = course?.[lessonId];

  // If demo answers are requested, return them
  if (wantDemoAnswers && selectedAssignment) {
    return res.status(200).json({
      success: true,
      demoAnswers: {
        code: selectedAssignment.demoCode || demoAnswers.demoTemplate,
        reflections: selectedAssignment.demoReflections || demoAnswers.demoReflections,
        followups: selectedAssignment.demoFollowups || demoAnswers.demoFollowups
      }
    });
  }

  // =========================
  // SMART FALLBACK WITH 3-STEP FLOW
  // =========================
  const response = selectedAssignment || {
    title: `📌 Practice: ${lessonTitle}`,
    projectTask: `Build something practical based on "${lessonTitle}". Apply what you learned in real-world form.${
      hasPreviousWork ? " Extend your previous work with new features." : ""
    }`,
    reflection: [
      "Why did you choose this approach?",
      "What challenge did you overcome?",
      "How would you improve this next time?"
    ],
    followUp: [
      "What was the most important concept in this lesson?",
      "How would you apply this to a real project?",
      "What do you want to learn next?"
    ],
    demoCode: demoAnswers.demoTemplate,
    demoReflections: demoAnswers.demoReflections,
    demoFollowups: demoAnswers.demoFollowups
  };

  // =========================
  // RESPONSE WITH FULL ASSIGNMENT FLOW
  // =========================
  return res.status(200).json({
    success: true,
    assignment: {
      title: response.title,
      projectTask: response.projectTask,
      course: courseKey,
      lessonId,
      lessonTitle,
      hasPreviousWork,
      reflectionQuestions: response.reflection,
      followUpQuestions: response.followUp,
      hasDemoAnswers: true,
      rubric: {
        projectBuild: 60,
        reflection: 20,
        followUp: 20,
        passingGrade: 70,
        criteria: {
          "Project Build": [
            "Code works and meets requirements",
            "Good structure and organization",
            "Appropriate technology choices",
            "Clean UI/UX implementation"
          ],
          "Reflection": [
            "Shows understanding of choices",
            "Identifies challenges solved",
            "Demonstrates growth mindset"
          ],
          "Follow-up Questions": [
            "Shows deep understanding",
            "Original thinking demonstrated",
            "Can explain technical decisions"
          ]
        }
      },
      submissionFormat: {
        code: "Your project code or link",
        reflections: "Answers to reflection questions",
        followUpAnswers: "Answers to follow-up questions",
        demoLink: "Optional: Live demo URL"
      },
      instructions: {
        step1: "Build or extend your project based on the task above",
        step2: "Answer all reflection questions explaining your decisions",
        step3: "Answer all follow-up questions before final submission",
        tip: "Be specific in your answers. Show your thinking process.",
        demo: "Request demo answers by setting getDemoAnswers: true"
      }
    }
  });
}

// =========================
// HELPER: Handle GET requests for courses list
// =========================
function handleGetRequest(req, res) {
  const { action, courseKey } = req.query;
  
  if (action === "courses") {
    return res.status(200).json({
      success: true,
      courses: [
        { key: "frontend-development", name: "Frontend Development", topics: 12 },
        { key: "backend-development", name: "Backend Development", topics: 3 },
        { key: "game-development", name: "Game Development", topics: 1 },
        { key: "robotics-ai", name: "Robotics & AI", topics: 1 }
      ]
    });
  }
  
  if (action === "topics" && courseKey) {
    const topicsMap = {
      "frontend-development": Array.from({ length: 12 }, (_, i) => ({
        id: i + 1,
        title: getTopicTitle(i + 1, "frontend"),
        description: getTopicDescription(i + 1, "frontend")
      })),
      "backend-development": Array.from({ length: 3 }, (_, i) => ({
        id: i + 1,
        title: getTopicTitle(i + 1, "backend"),
        description: getTopicDescription(i + 1, "backend")
      }))
    };
    return res.status(200).json({
      success: true,
      topics: topicsMap[courseKey] || []
    });
  }
  
  return res.status(200).json({ success: true, message: "Assignment API is running" });
}

function getTopicTitle(id, type) {
  if (type === "frontend") {
    const titles = {
      1: "🌐 How the Web Works",
      2: "🏗️ Semantic HTML",
      3: "🎨 Modern CSS Layout",
      4: "🚀 Startup Landing Page",
      5: "🧠 JavaScript Fundamentals",
      6: "🎛️ DOM Manipulation",
      7: "🌍 API Integration",
      8: "📱 Interactive Web App",
      9: "🔗 Git & GitHub",
      10: "📱 Responsive UI",
      11: "🚀 Deployment",
      12: "🏆 Final Portfolio"
    };
    return titles[id] || `Lesson ${id}`;
  }
  const titles = { 1: "⚙️ Server Architecture", 2: "🚀 Node.js Event Loop", 3: "🧩 Express API" };
  return titles[id] || `Lesson ${id}`;
}

function getTopicDescription(id, type) {
  if (type === "frontend") {
    const descs = {
      1: "Understand how browsers, servers, and DNS work together",
      2: "Build accessible websites with proper semantic structure",
      3: "Master Flexbox and CSS Grid for responsive designs",
      4: "Create a modern landing page with CTA and navigation",
      5: "Learn variables, functions, arrays, and events",
      6: "Build interactive components like modals and tabs",
      7: "Fetch and display data from real APIs",
      8: "Create a To-Do or Weather app with local storage",
      9: "Learn Git workflow and GitHub collaboration",
      10: "Mobile-first responsive design patterns",
      11: "Deploy to Vercel, Netlify, or GitHub Pages",
      12: "Build your professional developer portfolio"
    };
    return descs[id] || "Complete this assignment to master the topic";
  }
  return "Master backend development concepts";
}

// =========================
// HELPER: Get base demo template
// =========================
function getBaseDemoTemplate() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Responsive Web Design Demo</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      color: #333;
    }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    header {
      background: rgba(255,255,255,0.95);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 20px;
      margin-bottom: 30px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    nav ul {
      display: flex;
      gap: 20px;
      list-style: none;
      justify-content: center;
      flex-wrap: wrap;
    }
    nav a {
      color: #667eea;
      text-decoration: none;
      padding: 10px 20px;
      border-radius: 10px;
      transition: all 0.3s ease;
      font-weight: 500;
    }
    nav a:hover {
      background: #667eea;
      color: white;
      transform: translateY(-2px);
    }
    .hero {
      text-align: center;
      padding: 60px 20px;
      background: rgba(255,255,255,0.95);
      border-radius: 30px;
      margin-bottom: 40px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    }
    .hero h1 {
      font-size: 3rem;
      margin-bottom: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero p { font-size: 1.2rem; color: #666; margin-bottom: 30px; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 30px;
      margin-bottom: 40px;
    }
    .card {
      background: white;
      padding: 30px;
      border-radius: 20px;
      transition: all 0.3s ease;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }
    .card h3 { color: #667eea; margin-bottom: 15px; font-size: 1.5rem; }
    .card p { color: #666; line-height: 1.6; }
    .btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 12px 30px;
      border-radius: 10px;
      cursor: pointer;
      font-size: 1rem;
      font-weight: 600;
      transition: all 0.3s ease;
    }
    .btn:hover {
      transform: scale(1.05);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
    }
    footer {
      text-align: center;
      padding: 30px;
      background: rgba(255,255,255,0.95);
      border-radius: 20px;
      margin-top: 20px;
      color: #666;
    }
    @media (max-width: 768px) {
      .hero h1 { font-size: 2rem; }
      .hero p { font-size: 1rem; }
      nav ul { flex-direction: column; align-items: center; }
      .grid { grid-template-columns: 1fr; }
      .container { padding: 10px; }
    }
    @media (prefers-reduced-motion: reduce) {
      * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
    }
    :focus-visible { outline: 3px solid #667eea; outline-offset: 2px; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <nav aria-label="Main navigation">
        <ul>
          <li><a href="#" aria-current="page">Home</a></li>
          <li><a href="#">About</a></li>
          <li><a href="#">Services</a></li>
          <li><a href="#">Portfolio</a></li>
          <li><a href="#">Contact</a></li>
        </ul>
      </nav>
    </header>
    <main>
      <section class="hero" aria-label="Hero section">
        <h1>Welcome to Modern Web Development</h1>
        <p>Building responsive, accessible, and performant websites</p>
        <button class="btn" onclick="handleClick()" aria-label="Get started button">Get Started</button>
      </section>
      <section class="grid" aria-label="Features section">
        <article class="card"><h3>📱 Responsive Design</h3><p>Works on all devices with fluid layouts.</p></article>
        <article class="card"><h3>🎨 Modern CSS</h3><p>CSS Grid, Flexbox, and modern features.</p></article>
        <article class="card"><h3>⚡ Interactive Features</h3><p>JavaScript-powered interactions.</p></article>
        <article class="card"><h3>♿ Accessibility First</h3><p>Built with WCAG guidelines.</p></article>
      </section>
    </main>
    <footer><p>&copy; 2024 Modern Web Development. All rights reserved.</p></footer>
  </div>
  <script>
    function handleClick() { alert('Welcome! Interactive features demo.'); }
    console.log('Page loaded successfully');
  </script>
</body>
</html>`;
}

// =========================
// HELPER: Get complete assignments database
// =========================
function getAssignmentsDatabase(demoAnswers, hasPreviousWork) {
  return {
    "frontend-development": {
      1: {
        title: "🌐 How the Web Works Simulation",
        projectTask: "Create a visual or HTML explanation showing how Browser, Server, DNS, and Hosting work together in real websites.",
        reflection: ["Why did you choose this visual format?", "What was the hardest concept to explain?", "How would you improve this explanation for beginners?"],
        followUp: ["What happens when you type a URL in browser?", "How does DNS caching improve performance?", "What security considerations exist in this flow?"],
        demoCode: demoAnswers.demoTemplate,
        demoReflections: demoAnswers.demoReflections,
        demoFollowups: demoAnswers.demoFollowups
      },
      2: {
        title: "🏗️ Semantic HTML Builder",
        projectTask: "Build a full website using semantic HTML tags (header, nav, section, article, footer). Make it structured like a real production site.",
        reflection: ["Why did you choose this semantic structure?", "What accessibility improvements did you implement?", "What would you add next time?"],
        followUp: ["Why use <article> vs <section>?", "How does semantic HTML help SEO?", "What landmark roles would you add?"],
        demoCode: demoAnswers.demoTemplate,
        demoReflections: demoAnswers.demoReflections,
        demoFollowups: demoAnswers.demoFollowups
      },
      3: {
        title: "🎨 Modern CSS Layout Challenge",
        projectTask: "Create a fully responsive layout using Flexbox and CSS Grid that adapts to mobile, tablet, and desktop.",
        reflection: ["Why did you use Grid vs Flexbox?", "What responsive challenge did you solve?", "How would you optimize performance?"],
        followUp: ["When would you use CSS Grid over Flexbox?", "How do you test responsive designs?", "What's the difference between em and rem?"],
        demoCode: demoAnswers.demoTemplate,
        demoReflections: demoAnswers.demoReflections,
        demoFollowups: demoAnswers.demoFollowups
      },
      4: {
        title: "🚀 Startup Landing Page Project",
        projectTask: hasPreviousWork ? "Extend your landing page. Add responsive navigation, hero section, and CTA interactions." : "Create a startup landing page with responsive design and interactive elements.",
        reflection: ["Why did you choose this layout?", "What problem did you solve?", "What would you improve next?"],
        followUp: ["Why Grid vs Flexbox here?", "How to make accessible for screen readers?", "What bug did you debug?"],
        demoCode: demoAnswers.demoTemplate,
        demoReflections: demoAnswers.demoReflections,
        demoFollowups: demoAnswers.demoFollowups
      },
      5: {
        title: "🧠 JavaScript Fundamentals Challenge",
        projectTask: hasPreviousWork ? "Extend your JS code with error handling, input validation, and a new feature." : "Create real-world JavaScript logic using variables, functions, arrays, and events.",
        reflection: ["Why this architecture?", "What edge cases did you handle?", "How would you refactor?"],
        followUp: ["Difference between == and ===?", "How does event delegation work?", "When to use a closure?"],
        demoCode: getCalculatorDemoCode(),
        demoReflections: getCalculatorReflections(),
        demoFollowups: getCalculatorFollowups()
      },
      6: {
        title: "🎛️ DOM Manipulation Mastery",
        projectTask: hasPreviousWork ? "Add interactive components to your existing UI (modal, dropdown, tab system)." : "Build interactive components like modal, dropdown, or tab system using DOM manipulation.",
        reflection: ["Why these components?", "What DOM challenges?", "How to improve performance?"],
        followUp: ["innerHTML vs createElement?", "How to prevent memory leaks?", "When to use event delegation?"],
        demoCode: demoAnswers.demoTemplate,
        demoReflections: demoAnswers.demoReflections,
        demoFollowups: demoAnswers.demoFollowups
      },
      7: {
        title: "🌍 API Integration Project",
        projectTask: hasPreviousWork ? "Add error handling, loading states, and caching to your API integration." : "Fetch real data from an API (weather, crypto, or users) and display it dynamically.",
        reflection: ["Why this API?", "What async challenges?", "How to add offline support?"],
        followUp: ["How to handle API errors?", "Promises vs async/await?", "How to cache responses?"],
        demoCode: getAPIDemoCode(),
        demoReflections: getAPIReflections(),
        demoFollowups: getAPIFollowups()
      },
      8: {
        title: "📱 Interactive Web App",
        projectTask: hasPreviousWork ? "Extend your To-Do or Weather App with data persistence, editing, and filtering." : "Build a To-Do App or Weather App with local storage and dynamic UI updates.",
        reflection: ["Why this architecture?", "What state management challenge?", "How to add user accounts?"],
        followUp: ["localStorage vs sessionStorage?", "How to sync across tabs?", "Security concerns?"],
        demoCode: getTodoAppCode(),
        demoReflections: getTodoReflections(),
        demoFollowups: getTodoFollowups()
      },
      9: {
        title: "🔗 Git & GitHub Workflow",
        projectTask: "Simulate Git workflow: init repo, commit changes, push to GitHub, and explain team collaboration strategy.",
        reflection: ["Why this branching strategy?", "What merge conflicts?", "How to handle code review?"],
        followUp: ["git merge vs rebase?", "How to revert a bad commit?", "What's a typical CI/CD pipeline?"],
        demoCode: getGitDemoCode(),
        demoReflections: getGitReflections(),
        demoFollowups: getGitFollowups()
      },
      10: {
        title: "📱 Responsive UI Design",
        projectTask: hasPreviousWork ? "Redesign your webpage using mobile-first approach with perfect responsiveness." : "Create a mobile-first responsive webpage that works on all screen sizes.",
        reflection: ["Why mobile-first?", "What responsive patterns?", "How to test on real devices?"],
        followUp: ["What breakpoints and why?", "How to optimize images?", "Relative vs absolute units?"],
        demoCode: demoAnswers.demoTemplate,
        demoReflections: demoAnswers.demoReflections,
        demoFollowups: demoAnswers.demoFollowups
      },
      11: {
        title: "🚀 Deployment Challenge",
        projectTask: "Deploy your frontend project using Vercel, Netlify, or GitHub Pages, configure custom domain, and enable HTTPS.",
        reflection: ["Why this platform?", "What deployment challenges?", "How to set up preview deployments?"],
        followUp: ["What environment variables?", "How to implement blue-green deployment?", "What's your rollback strategy?"],
        demoCode: getDeploymentDemoCode(),
        demoReflections: getDeploymentReflections(),
        demoFollowups: getDeploymentFollowups()
      },
      12: {
        title: "🏆 Final Portfolio Project",
        projectTask: hasPreviousWork ? "Add a blog section, case studies, and optimize your portfolio for performance and SEO." : "Build a professional developer portfolio with projects, skills, about section, and contact form.",
        reflection: ["Why this portfolio structure?", "What makes projects stand out?", "How to improve for job apps?"],
        followUp: ["How to measure success?", "What analytics to add?", "How to optimize Core Web Vitals?"],
        demoCode: demoAnswers.demoTemplate,
        demoReflections: getPortfolioReflections(),
        demoFollowups: getPortfolioFollowups()
      }
    },
    "backend-development": {
      1: {
        title: "⚙️ Server Architecture Map",
        projectTask: "Explain how a backend server processes requests from client to database with diagram and code examples.",
        reflection: ["Why this architecture?", "What bottleneck first?", "How to scale?"],
        followUp: ["Vertical vs horizontal scaling?", "How to add caching?", "What monitoring?"],
        demoCode: getServerArchDemoCode(),
        demoReflections: getServerArchReflections(),
        demoFollowups: getServerArchFollowups()
      },
      2: {
        title: "🚀 Node.js Event Loop",
        projectTask: hasPreviousWork ? "Refactor Node.js code to avoid blocking operations and optimize event loop." : "Explain/diagram how Node.js event loop works with examples.",
        reflection: ["Why this async pattern?", "What blocking operation?", "How to measure performance?"],
        followUp: ["setImmediate vs nextTick?", "How to handle CPU tasks?", "What causes event loop lag?"],
        demoCode: getEventLoopDemoCode(),
        demoReflections: getEventLoopReflections(),
        demoFollowups: getEventLoopFollowups()
      },
      3: {
        title: "🧩 Express API Builder",
        projectTask: hasPreviousWork ? "Add middleware, error handling, validation, and auth to your Express API." : "Create an Express server with 5+ API routes including CRUD operations.",
        reflection: ["Why this route structure?", "What middleware needed?", "How to document API?"],
        followUp: ["app.use vs app.METHOD?", "How to implement rate limiting?", "What security headers?"],
        demoCode: getExpressDemoCode(),
        demoReflections: getExpressReflections(),
        demoFollowups: getExpressFollowups()
      }
    },
    "game-development": {
      1: {
        title: "🎮 Game Loop Fundamentals",
        projectTask: "Create a basic game loop using requestAnimationFrame or setInterval. Implement update and render functions.",
        reflection: ["Why did you choose this game loop structure?", "What performance considerations did you make?", "How would you add physics?"],
        followUp: ["What's the difference between requestAnimationFrame and setInterval?", "How do you handle delta time?", "What causes frame drops?"],
        demoCode: getGameLoopDemoCode(),
        demoReflections: getGameLoopReflections(),
        demoFollowups: getGameLoopFollowups()
      }
    },
    "robotics-ai": {
      1: {
        title: "🤖 AI Decision Making",
        projectTask: "Create a simple decision tree or rule-based AI for a robot navigation system.",
        reflection: ["Why this decision structure?", "What edge cases did you consider?", "How would you add machine learning?"],
        followUp: ["What's the difference between rule-based and ML?", "How do you handle uncertainty?", "What are common AI algorithms?"],
        demoCode: getAIDemoCode(),
        demoReflections: getAIReflections(),
        demoFollowups: getAIFollowups()
      }
    }
  };
}

// Helper functions for various demo codes and reflections
function getCalculatorDemoCode() { 
  return `// JavaScript Calculator Demo
class Calculator {
  constructor() {
    this.currentValue = 0;
    this.previousValue = null;
    this.operation = null;
  }
  appendNumber(number) {
    this.currentValue = this.currentValue === 0 ? number : this.currentValue + number;
  }
  chooseOperation(op) {
    if (this.previousValue !== null) this.compute();
    this.operation = op;
    this.previousValue = this.currentValue;
    this.currentValue = null;
  }
  compute() {
    const prev = parseFloat(this.previousValue);
    const current = parseFloat(this.currentValue);
    if (isNaN(prev) || isNaN(current)) return;
    switch(this.operation) {
      case '+': this.currentValue = prev + current; break;
      case '-': this.currentValue = prev - current; break;
      case '*': this.currentValue = prev * current; break;
      case '/': this.currentValue = prev / current; break;
    }
    this.operation = null;
    this.previousValue = null;
  }
}
const calc = new Calculator();
calc.appendNumber('5');
calc.chooseOperation('+');
calc.appendNumber('3');
calc.compute(); // 8`;
}

function getCalculatorReflections() { 
  return [
    "I chose a class-based architecture for encapsulation and maintainability. This makes the code organized and easy to extend with new operations.", 
    "Edge cases like division by zero and decimal precision were challenging. I added input validation and type checking to handle these gracefully.", 
    "Next time I would add keyboard support, calculation history, and unit tests for reliability."
  ]; 
}

function getCalculatorFollowups() { 
  return [
    "=== compares both value and type without coercion, while == performs type conversion. Always use === to avoid unexpected bugs.", 
    "Event delegation attaches one listener to a parent instead of individual children, improving performance and handling dynamic elements.", 
    "Closures are useful for creating private variables and maintaining state in callbacks, commonly used in module patterns and React hooks."
  ]; 
}

function getAPIDemoCode() { 
  return `async function fetchData(endpoint) {
  try {
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Error:', error);
    return null;
  }
}`; 
}

function getAPIReflections() { 
  return [
    "I chose a free, well-documented API with good CORS support for reliable data fetching.", 
    "Race conditions were challenging. I used abort controllers to ensure the latest request updates the UI.", 
    "For offline support, implement service workers and cache API responses in IndexedDB."
  ]; 
}

function getAPIFollowups() { 
  return [
    "Always use try-catch, check response.ok, show user-friendly errors, and implement retry logic.", 
    "async/await is syntactic sugar over Promises, making code more readable while Promises are the underlying mechanism.", 
    "Cache in localStorage for simple data, IndexedDB for larger datasets, always set expiration times."
  ]; 
}

function getTodoAppCode() { 
  return `class TodoApp {
  constructor() {
    this.todos = JSON.parse(localStorage.getItem('todos') || '[]');
  }
  addTodo(text) {
    this.todos.push({ id: Date.now(), text, completed: false });
    this.save();
  }
  save() { localStorage.setItem('todos', JSON.stringify(this.todos)); }
}`; 
}

function getTodoReflections() { 
  return [
    "I chose a class-based MVC-like architecture to separate concerns and make the code maintainable.", 
    "State management was challenging. I centralized state in the class and re-render on any change for consistency.", 
    "To add user accounts, implement JWT authentication and replace localStorage with a backend API."
  ]; 
}

function getTodoFollowups() { 
  return [
    "localStorage persists until cleared; sessionStorage clears when tab closes.", 
    "Use the storage event listener or BroadcastChannel API for cross-tab communication.", 
    "localStorage is vulnerable to XSS attacks. Never store sensitive data like tokens."
  ]; 
}

function getGitDemoCode() { 
  return `git init
git add .
git commit -m "Initial commit"
git branch feature/new
git checkout feature/new
git push origin feature/new`; 
}

function getGitReflections() { 
  return [
    "I use GitFlow with main, develop, feature, release, and hotfix branches for clear isolation.", 
    "Merge conflicts happen when multiple devs modify the same file. Smaller PRs and regular rebasing help.", 
    "Code review includes automated checks, two approvals, and checking standards, security, and docs."
  ]; 
}

function getGitFollowups() { 
  return [
    "Merge creates a merge commit; rebase rewrites history for a linear view.", 
    "Use 'git revert <hash>' to create an inverse commit, or 'git reset' for local changes only.", 
    "CI/CD: push → tests → build → staging → integration tests → production → monitor."
  ]; 
}

function getDeploymentDemoCode() { 
  return `{
  "version": 2,
  "builds": [{ "src": "index.html", "use": "@vercel/static" }],
  "routes": [{ "handle": "filesystem" }, { "src": "/(.*)", "dest": "/index.html" }]
}`; 
}

function getDeploymentReflections() { 
  return [
    "I chose Vercel for seamless Git integration, automatic SSL, global CDN, and preview deployments.", 
    "Managing environment variables across environments was challenging. I used Vercel's env system.", 
    "Preview deployments are auto-created for each PR via GitHub integration."
  ]; 
}

function getDeploymentFollowups() { 
  return [
    "API endpoints, DB strings, secret keys, feature flags. Never commit sensitive values.", 
    "Blue-green deployment maintains two environments (blue=live, green=idle). Deploy to green, test, then switch traffic.", 
    "Rollback: keep previous artifacts, use Git tags, automated scripts, and DB rollback plans."
  ]; 
}

function getPortfolioReflections() { 
  return [
    "I chose a clean, minimalist portfolio structure that puts projects front and center.", 
    "My projects solve real problems, have clean code, case studies, and demonstrate best practices.", 
    "To improve, add testimonials, quantify impacts, create a blog, and optimize for recruiters."
  ]; 
}

function getPortfolioFollowups() { 
  return [
    "Success metrics: time on site, click-through rates, form submissions, resume downloads.", 
    "Add Google Analytics, Hotjar heatmaps, custom events, and monitor Core Web Vitals.", 
    "Optimize LCP (images), FID (defer JS), CLS (set dimensions, reserve space)."
  ]; 
}

function getServerArchDemoCode() { 
  return `const express = require('express');
const app = express();
app.use(express.json());
app.get('/api/users', (req, res) => res.json({ users: [] }));
app.listen(3000);`; 
}

function getServerArchReflections() { 
  return [
    "I chose layered architecture for separation of concerns, making code maintainable and testable.", 
    "The database query layer is the first bottleneck. Add indexes, optimization, and Redis caching.", 
    "Scale with load balancer, multiple instances, read replicas, message queues, and CDN."
  ]; 
}

function getServerArchFollowups() { 
  return [
    "Vertical adds power to existing servers; horizontal adds more servers (more cost-effective and fault-tolerant).", 
    "Implement Redis cache between service and DB with TTL, cache-aside pattern, and invalidation.", 
    "Implement logging (Winston), metrics (Prometheus), tracing (Jaeger), dashboards (Grafana)."
  ]; 
}

function getEventLoopDemoCode() { 
  return `// Non-blocking example
setTimeout(() => console.log('Timer'), 0);
process.nextTick(() => console.log('nextTick'));
setImmediate(() => console.log('setImmediate'));

// Event loop order: nextTick → timer → setImmediate → I/O`; 
}

function getEventLoopReflections() { 
  return [
    "I chose async/await for readability and maintainability while keeping non-blocking behavior.", 
    "Synchronous file read (readFileSync) was blocking. I replaced it with async readFile.", 
    "Measure with perf_hooks module, event loop lag detection, and APM tools."
  ]; 
}

function getEventLoopFollowups() { 
  return [
    "nextTick executes before I/O at current phase; setImmediate after I/O callbacks. nextTick has higher priority.", 
    "Use Worker Threads for CPU tasks, offload to microservices, or use job queues.", 
    "Large JSON parsing, heavy crypto, sync file reads, infinite loops cause lag."
  ]; 
}

function getExpressDemoCode() { 
  return `const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const app = express();
app.use(helmet());
app.use(rateLimit({ windowMs: 15*60*1000, max: 100 }));
app.get('/api/users', (req, res) => res.json({ users: [] }));
app.listen(3000);`; 
}

function getExpressReflections() { 
  return [
    "I chose modular route structure with separate files for each resource, scaling well as the API grows.", 
    "Middleware: body-parser, cors, helmet, morgan, compression, and custom auth.", 
    "Document with OpenAPI/Swagger for interactive docs and Postman collections."
  ]; 
}

function getExpressFollowups() { 
  return [
    "app.METHOD for specific HTTP methods; app.use matches any method for middleware.", 
    "Use express-rate-limit, store rate data in Redis for distributed systems.", 
    "Add Helmet for security headers: X-Frame-Options, XSS-Protection, HSTS, CSP."
  ]; 
}

// Game Development helper functions
function getGameLoopDemoCode() {
  return `// Basic Game Loop
class GameLoop {
  constructor() {
    this.lastTimestamp = 0;
    this.gameObjects = [];
    this.isRunning = false;
  }
  
  start() {
    this.isRunning = true;
    requestAnimationFrame(this.loop.bind(this));
  }
  
  loop(timestamp) {
    const deltaTime = Math.min(0.033, (timestamp - this.lastTimestamp) / 1000);
    this.lastTimestamp = timestamp;
    this.update(deltaTime);
    this.render();
    if (this.isRunning) requestAnimationFrame(this.loop.bind(this));
  }
  
  update(deltaTime) {
    this.gameObjects.forEach(obj => obj.update(deltaTime));
  }
  
  render() {
    // Render all objects
  }
}`;
}

function getGameLoopReflections() {
  return [
    "I chose requestAnimationFrame for smooth 60fps animations and automatic frame synchronization with browser refresh rates.",
    "Performance considerations included delta time for frame-independent movement and object pooling for particle systems.",
    "To add physics, I would integrate matter.js or implement basic Euler integration for movement and collision detection."
  ];
}

function getGameLoopFollowups() {
  return [
    "requestAnimationFrame is optimized for animations and pauses when tab is inactive; setInterval runs regardless of tab visibility.",
    "Delta time is calculated as (currentTime - lastTime) / 1000, used to make movement speed independent of frame rate.",
    "Frame drops occur from heavy computations, garbage collection pauses, or memory leaks. Profile with Chrome DevTools."
  ];
}

// AI & Robotics helper functions
function getAIDemoCode() {
  return `// Simple Decision Tree AI
class RobotAI {
  constructor() {
    this.state = 'explore';
  }
  
  decide(sensors) {
    if (sensors.battery < 20) return 'recharge';
    if (sensors.obstacleDistance < 50) return 'avoid';
    if (sensors.targetDetected) return 'approach';
    return 'explore';
  }
  
  act(decision) {
    switch(decision) {
      case 'recharge': return { move: 'stop', action: 'charge' };
      case 'avoid': return { move: 'turn', direction: 'left' };
      case 'approach': return { move: 'forward', speed: 'medium' };
      default: return { move: 'wander', speed: 'slow' };
    }
  }
}`;
}

function getAIReflections() {
  return [
    "I chose a decision tree because it's simple, interpretable, and performs well for rule-based navigation with few states.",
    "Edge cases included simultaneous obstacles and low battery, solved by priority ordering (battery > obstacle > target).",
    "To add ML, I would implement Q-learning with state discretization or use TensorFlow.js for neural networks."
  ];
}

function getAIFollowups() {
  return [
    "Rule-based works for deterministic environments; ML handles uncertainty and patterns but requires data and training.",
    "Handle uncertainty with probability distributions, fuzzy logic, or Monte Carlo methods combined with sensor fusion.",
    "Common algorithms: A* for pathfinding, Decision Trees, Neural Networks, Reinforcement Learning (DQN), and Behavior Trees."
  ];
}