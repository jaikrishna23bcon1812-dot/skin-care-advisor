# 🧴 AI Skin Care Advisor

A full-stack AI-powered skincare web application with personalized routine generation, progress tracking, before/after comparison, community features, and multi-language support.

## 🚀 Live Demo

- **Frontend:** [skin-care-advisor-frontend.vercel.app](https://skin-care-advisor-frontend.vercel.app)
- **Backend API:** [skin-care-api.onrender.com](https://skin-care-api.onrender.com)

> **Note:** The backend runs on Render's free tier, so the first request may take 30-50 seconds while the server wakes up.

## ✨ Features

### Core Features
- 🔐 **User Authentication** — Register/Login with JWT tokens and bcrypt password hashing
- 🤖 **AI Skin Analysis (Text)** — Personalized skincare routines using OpenRouter AI with fallback routines
- 📸 **AI Photo Analysis** — Upload a face photo and get AI-powered skin type + concern detection using vision models
- 📊 **Progress Tracker** — Log daily skin condition with interactive Line/Bar charts (Chart.js)
- 💾 **Cloud Database** — MongoDB Atlas for persistent storage

### Premium Features
- 🌙 **Dark Mode** — Toggle with saved preference
- 🔔 **Toast Notifications** — Beautiful slide-in notifications
- ⚡ **Loading Spinners** — Visual feedback during async operations
- 👤 **Profile Page** — View and edit personal info with avatar
- ⚙️ **Settings Page** — Account, password, notifications, appearance
- 📈 **Dashboard Stats** — Animated count-up cards (analyses, entries, streak, avg rating)
- 🛍️ **Product Catalogue** — 12+ curated skincare products with category + skin type filters
- 🎞️ **Before/After Comparison** — Interactive drag slider to compare photos
- 🌐 **Multi-Language** — English + Hindi toggle with saved preference
- 💬 **Community** — Share routines publicly, like, and comment
- 📧 **Email Reminders** — Daily routine reminders via Gmail with cron scheduler
- 🔔 **Push Notifications** — Browser notifications for routine + progress reminders
- 📤 **CSV Export** — Download progress data
- ⬆️ **Back to Top Button** — Smooth scroll
- 🎨 **Custom Scrollbar** — Pink gradient themed
- 📄 **Page Load Animations** — Smooth fade-in transitions

## 🛠️ Tech Stack

**Frontend:** HTML5, CSS3, JavaScript (ES6+), Chart.js  
**Backend:** Node.js, Express.js, JWT, bcryptjs, Nodemailer, node-cron  
**Database:** MongoDB Atlas, Mongoose  
**AI Providers:** OpenRouter API (text + vision), Groq API (fallback)  
**Email:** Gmail SMTP with App Password  
**Deployment:** Vercel (frontend), Render (backend)

## 📂 Project Structure

```
skin-care-advisor/
├── frontend/
│   ├── index.html          # Landing page
│   ├── login.html          # Login page
│   ├── register.html       # Registration page
│   ├── dashboard.html      # User dashboard with stats
│   ├── analysis.html       # AI skin analysis (text + photo)
│   ├── routine.html        # Personalized routine viewer
│   ├── progress.html       # Progress tracker with charts
│   ├── compare.html        # Before/After photo comparison
│   ├── community.html      # Community feed (posts, likes, comments)
│   ├── products.html       # Product catalogue with filters
│   ├── profile.html        # User profile editor
│   ├── settings.html       # Settings (account, password, notifications)
│   ├── script.js           # Main JavaScript (all page logic)
│   ├── style.css           # Global stylesheet (design system)
│   ├── translations.js     # English / Hindi i18n strings
│   └── favicon.svg         # App icon
│
├── backend/
│   ├── server.js           # Express app + MongoDB connection
│   ├── .env                # Environment variables (not committed)
│   ├── models/
│   │   ├── User.js         # User schema (name, email, password, settings)
│   │   ├── Analysis.js     # AI analysis results schema
│   │   ├── Progress.js     # Daily progress log schema
│   │   ├── Comparison.js   # Before/After photo schema
│   │   └── Post.js         # Community post schema (likes, comments)
│   ├── routes/
│   │   ├── auth.js         # Register, login, profile, password change
│   │   ├── analysis.js     # AI text + photo analysis endpoints
│   │   ├── progress.js     # Progress CRUD + CSV export
│   │   ├── comparison.js   # Before/After photo storage
│   │   ├── community.js    # Posts, likes, comments endpoints
│   │   └── reminder.js     # Email reminder save + test endpoints
│   └── utils/
│       └── reminderScheduler.js  # node-cron daily email scheduler
│
├── screenshots/            # App screenshots for docs
├── .gitignore
├── LICENSE
└── README.md
```

## 🔧 Setup & Installation

### Prerequisites
- Node.js v18+
- MongoDB Atlas account
- OpenRouter API key
- Gmail account with App Password

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` folder:

```env
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
OPENROUTER_API_KEY=your_openrouter_api_key
GROQ_API_KEY=your_groq_api_key
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
```

Start the server:

```bash
node server.js
```

Expected output:
```
MongoDB connected
⏰ Reminder scheduler started
Server running on port 5000
```

### Frontend Setup

No build step needed — open `frontend/index.html` directly in a browser, or serve with any static server.

For local development with the backend running on port 5000, update `API_URL` in `script.js`:

```js
const API_URL = "http://localhost:5000/api";
```

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create a new account |
| POST | `/api/auth/login` | Login and receive JWT |
| GET | `/api/auth/profile/:id` | Get user profile |
| PUT | `/api/auth/profile/:id` | Update profile |
| PUT | `/api/auth/change-password/:id` | Change password |
| POST | `/api/analysis/analyze` | AI text analysis |
| POST | `/api/analysis/analyze-photo` | AI photo analysis |
| GET | `/api/analysis/history/:id` | Get analysis history |
| POST | `/api/progress/add` | Log a progress entry |
| GET | `/api/progress/history/:id` | Get progress entries |
| GET | `/api/progress/export/:id` | Export progress as CSV |
| POST | `/api/comparison/save` | Save before/after photos |
| GET | `/api/comparison/latest/:id` | Get latest comparison |
| GET | `/api/community/posts` | Get all community posts |
| POST | `/api/community/add` | Share a new post |
| POST | `/api/community/like/:postId` | Like / unlike a post |
| POST | `/api/community/comment/:postId` | Add a comment |
| DELETE | `/api/community/post/:postId` | Delete own post |
| PUT | `/api/reminder/save` | Save email reminder settings |
| POST | `/api/reminder/test/:id` | Send a test reminder email |

## 📸 Screenshots

> Coming soon — will be added to the `screenshots/` folder.

## 🗓️ Development Log

| Day | Feature Added |
|-----|---------------|
| Day 1 | Project setup, landing page, auth UI |
| Day 2 | Backend auth (register/login/JWT) |
| Day 3 | AI text analysis + routine page |
| Day 4 | Progress tracker + Chart.js |
| Day 5 | Dashboard stats, profile, settings |
| Day 6 | Product catalogue + filters |
| Day 7 | Before/After comparison slider |
| Day 8 | Dark mode, toast notifications, CSV export |
| Day 9 | Multi-language (Hindi), photo AI analysis |
| Day 10 | Community feed, email reminders, push notifications |

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

## 👨‍💻 Author

Built with ❤️ as a personal project to practice full-stack development with AI integration.
