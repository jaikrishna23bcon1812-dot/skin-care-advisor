# 🧴 AI Skin Care Advisor

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://skin-care-advisor-frontend.vercel.app)
[![API Status](https://img.shields.io/badge/Backend%20API-Render-46E3B7?style=for-the-badge&logo=render&logoColor=black)](https://skin-care-api.onrender.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

An intelligent, full-stack dermatological routine advisor and visual skin health tracker. Powered by multi-modal Vision AI and Large Language Models, the application evaluates facial skin health, analyzes ingredient safety for pore-clogging comedogens, tracks routine adherence with cloud-synced daily streaks, and functions as an installable Progressive Web Application (PWA).

---

## 🚀 Live Deployments

- **Frontend Application (Vercel):** [https://skin-care-advisor-frontend.vercel.app](https://skin-care-advisor-frontend.vercel.app)
- **Production Backend API (Render):** [https://skin-care-api.onrender.com](https://skin-care-api.onrender.com)
- **Health Check Endpoint:** [https://skin-care-api.onrender.com/health](https://skin-care-api.onrender.com/health)

> **Note on Render Free-Tier Cold Starts:**  
> The backend runs on Render's managed platform, which spins down idle instances. An automated client-side health probe detects sleeping instances and triggers an informative overlay with an active elapsed seconds counter (typically 30–50s) while spinning up the backend instance.

---

## 🛠️ Technology Stack

| Layer | Badges & Technologies |
|---|---|
| **Frontend Core** | ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white) ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white) ![Vanilla JS](https://img.shields.io/badge/Vanilla%20JS%20(ES6+)-F7DF1E?style=flat-square&logo=javascript&logoColor=black) |
| **Visualizations & PWA** | ![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=flat-square&logo=chartdotjs&logoColor=white) ![Service Worker](https://img.shields.io/badge/Service%20Worker%20(PWA%20v8)-5A0FC8?style=flat-square&logo=pwa&logoColor=white) |
| **Backend & Runtime** | ![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white) ![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white) |
| **Database & Auth** | ![MongoDB Atlas](https://img.shields.io/badge/MongoDB%20Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white) ![JWT](https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white) ![bcryptjs](https://img.shields.io/badge/bcryptjs-2B579A?style=flat-square) |
| **AI Intelligence** | ![OpenRouter](https://img.shields.io/badge/OpenRouter%20AI-6366F1?style=flat-square&logo=openai&logoColor=white) ![Groq AI](https://img.shields.io/badge/Groq%20AI%20(Llama%203.3)-F55036?style=flat-square&logo=fastapi&logoColor=white) |

---

## ✨ Core Features Implemented

- 🤖 **AI Skin Regimen & Visual Vision Analysis (Webcam + File Upload)**  
  - Formulate customized AM/PM skincare regimens based on skin types and specific concerns using OpenRouter/Groq LLMs.
  - Live webcam capture via `getUserMedia` and selfie photo file uploads (`base64`) evaluated through Vision AI models with a reliable dermatological fallback routine.

- 🔐 **User Authentication & MongoDB Atlas Sync (JWT, bcrypt, cloud streak tracking)**  
  - Complete user registration and login workflows backed by `bcryptjs` password hashing and signed JSON Web Tokens (JWT).
  - Cloud synchronization ensures routine streaks and AM/PM completion statuses persist across sessions and devices via MongoDB Atlas.

- 📅 **Daily AM/PM Streak Counter with Automatic Reminders**  
  - Interactive morning and evening routine check-ins with dynamic streak calculation.
  - Scheduled browser push notifications for daily AM (8:00 AM) and PM (9:00 PM) reminders with permission management and instant test notifications.

- 🔬 **Comedogenic & Acne-Trigger Ingredient Safety Scanner**  
  - Real-time client-side ingredient parser assessing product formulations against known pore-clogging comedogens and acne aggravators.
  - Color-coded hazard pills and categorized safety ratings for quick product evaluation.

- 📄 **Clean PDF Routine Export with Print-Specific Stylesheets**  
  - Tailored `@media print` CSS rules automatically omit interactive chrome, navigation headers, and control buttons, formatting routines into a clean, professional PDF document ready for printing or digital archiving.

- ⚡ **PWA Offline Support & Stale-While-Revalidate Caching (Service Worker v8)**  
  - Fully installable Progressive Web App with manifest configuration.
  - Intelligent caching strategy serving cached assets instantly while refreshing them in the background, with explicit cache bypass rules for `/api/` and `/health` requests.

- ⏱️ **Render Cold-Start Mitigation**  
  - Integrated health check monitor automatically pinging `/health` on app initialization.
  - Displays a modal with a live elapsed counter when the free-tier backend is spinning up, eliminating uncertainty during cold boots.

- 🎨 **Modern Aesthetic: Frosted Sticky Navbar, Elevated Card Containers, and Unified Dark Mode**  
  - Frosted glassmorphism sticky header (`backdrop-filter: blur(12px)`), centered 1100px layout container, and elevated card containers with smooth hover states.
  - Seamless dark/light theme switching persisted across all pages with custom CSS design tokens.

---

## 🌐 API Reference Table

Base Backend URL: `https://skin-care-api.onrender.com`

| Method | Endpoint | Auth | Description | Request Payload / Params |
|---|---|:---:|---|---|
| `POST` | `/api/auth/register` | Public | Register new user account with hashed password | `{ "email": "...", "password": "...", "name": "..." }` |
| `POST` | `/api/auth/login` | Public | Authenticate user credentials and return JWT | `{ "email": "...", "password": "..." }` |
| `GET` | `/api/auth/me` | Bearer Token | Fetch authenticated user profile & cloud streak data | *Headers: `Authorization: Bearer <token>`* |
| `PUT` | `/api/auth/streak` | Bearer Token | Sync streak count and AM/PM routine completion | `{ "streak": 5, "lastStreakDate": "YYYY-MM-DD", "amCompleted": true, "pmCompleted": false }` |
| `POST` | `/api/analysis/routine` | Public | Generate personalized AM/PM routine | `{ "skinType": "oily", "concern": "acne" }` |
| `POST` | `/api/analysis/photo` | Public | Visual facial analysis via Vision AI | `{ "image": "data:image/jpeg;base64,..." }` |
| `GET` | `/health` | Public | Service liveness probe for cold-start detection | *None* |
| `GET` | `/` | Public | Service greeting and system status | *None* |

---

## 💻 Local Setup & Environment Variables

### 1. Prerequisites
- **Node.js** (v18.x or higher)
- **npm** (v9.x or higher)
- **MongoDB Atlas** database connection string
- **OpenRouter** or **Groq** API key (optional — clinical fallback routines activate automatically if absent)

### 2. Clone the Repository
```bash
git clone https://github.com/jaikrishna23bcon1812-dot/skin-care-advisor.git
cd skin-care-advisor
```

### 3. Backend Setup
1. Navigate into the backend directory and install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Create a `.env` file in the `backend/` directory (see [.env.example](backend/.env.example)):
   ```env
   # Server Port
   PORT=5000

   # Database Connection
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/skincare?retryWrites=true&w=majority

   # JWT Secret Key
   JWT_SECRET=your_jwt_secret_key_here

   # AI LLM & Vision Providers (at least one)
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   GROQ_API_KEY=your_groq_api_key_here
   ```

3. Start the backend server:
   ```bash
   node server.js
   ```
   *Expected console output:*
   ```
   Connected to MongoDB Atlas successfully
   Server actively running on port 5000
   ```

### 4. Frontend Setup
The frontend uses standard web technologies with no compilation or build step required.

1. **Option A — Run with a local static server:**
   ```bash
   # From the project root
   npx serve frontend
   ```
   Open `http://localhost:3000` in your web browser.

2. **Option B — Served directly by the Express Backend:**
   The Express server serves the `frontend/` directory statically on `http://localhost:5000`.

3. **Development API Configuration:**  
   The application automatically routes requests to `http://localhost:5000` when running locally and `https://skin-care-api.onrender.com` in production:
   ```javascript
   const API_BASE_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
       ? "http://localhost:5000"
       : "https://skin-care-api.onrender.com";
   ```

---

## 📂 Project Structure

```
skin-care-advisor/
├── backend/
│   ├── models/
│   │   └── User.js               # Mongoose user schema with streak tracking
│   ├── routes/
│   │   ├── auth.js               # Register, login, me, and streak sync routes
│   │   └── analysis.js           # Routine and photo vision analysis routes
│   ├── .env.example              # Environment variable template
│   ├── package.json              # Backend dependencies
│   └── server.js                 # Express server & MongoDB initialization
│
├── frontend/
│   ├── index.html                # Main SPA landing page, camera module, analyzer
│   ├── products.html             # Curated skincare product catalogue
│   ├── progress.html             # Chart.js visual progress tracking
│   ├── compare.html              # Before/after comparison slider
│   ├── community.html            # Social routine feed
│   ├── settings.html             # Routine reminders & profile preferences
│   ├── style.css                 # Unified modern aesthetic design system & dark mode
│   ├── script.js                 # Frontend application logic, camera, API sync
│   ├── sw.js                     # Service Worker v8 (offline caching & push handling)
│   ├── manifest.json             # PWA web app manifest
│   └── favicon.svg               # Vector brand logo
│
├── .gitignore
├── LICENSE
└── README.md
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
