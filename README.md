# 🧴 AI Skin Care Advisor

A full-stack AI-powered skincare web application that generates personalized skincare routines based on user concerns, tracks skin progress over time, and offers a curated product catalogue — all with a modern dark mode UI.

## 🚀 Live Demo

- **Frontend:** [skin-care-advisor-frontend.vercel.app](https://skin-care-advisor-frontend.vercel.app)
- **Backend API:** [skin-care-api.onrender.com](https://skin-care-api.onrender.com)

> **Note:** The backend runs on Render's free tier, so the first request may take 30-50 seconds while the server wakes up.

## ✨ Features

### Core Features
- 🔐 **User Authentication** — Register/Login with JWT tokens and bcrypt password hashing
- 🤖 **AI Skin Analysis** — Personalized skincare routines using AI (OpenRouter + Groq)
- 📊 **Progress Tracker** — Log daily skin condition with interactive Line/Bar charts (Chart.js)
- 💾 **Cloud Database** — MongoDB Atlas for persistent storage
- 📱 **Fully Responsive** — Works beautifully on mobile, tablet, and desktop

### Premium Features
- 🌙 **Dark Mode** — Toggle with saved preference (localStorage)
- 🔔 **Toast Notifications** — Beautiful slide-in notifications instead of browser alerts
- ⚡ **Loading Spinners** — Visual feedback during async operations
- 👤 **Profile Page** — View and edit personal information with avatar
- ⚙️ **Settings Page** — Change password, manage notifications, appearance
- 📈 **Dashboard Stats** — Animated count-up cards for analyses, entries, streak, avg rating
- 🛍️ **Product Catalogue** — 12+ curated skincare products with filters
- 📤 **CSV Export** — Download progress data
- ⬆️ **Back to Top Button** — Smooth scroll
- 🎨 **Custom Scrollbar** — Pink gradient themed
- 📄 **Page Load Animations** — Smooth fade-in transitions

## 🛠️ Tech Stack

**Frontend:**
- HTML5, CSS3 (Custom design system with CSS variables)
- JavaScript (ES6+, fetch API)
- Chart.js (Data visualization)

**Backend:**
- Node.js, Express.js
- JWT (Authentication)
- bcryptjs (Password hashing)
- CORS

**Database:**
- MongoDB Atlas
- Mongoose ODM

**AI Providers:**
- OpenRouter API (Llama, Mistral, Gemma models)
- Groq API (Fallback)

**Deployment:**
- Vercel (Frontend)
- Render (Backend)

## 📂 Project Structure
