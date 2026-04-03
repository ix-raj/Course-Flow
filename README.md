# 🌊 Course Flow
[![Live Demo](https://img.shields.io/badge/Live_Demo-View_Project-indigo?style=for-the-badge)](https://course-flow-psi.vercel.app/)

<img width="1919" height="1103" alt="LandingPage" src="https://github.com/user-attachments/assets/5b0eeb06-9e12-4cdd-a65c-d15dc3b04362" />


**Course Flow** is a comprehensive, full-stack learning and productivity ecosystem designed to bridge the gap between local course execution and cloud-synced planning. It transforms messy local folders and disjointed notes into a unified, beautifully tracked educational journey.

By combining granular video-level progress tracking with high-level weekly and monthly goal setting, Course Flow ensures that every minute spent learning is purposeful, tracked, and securely backed up to the cloud.

---

## ✨ Key Features

### 📚 Cloud-Synced Course Library
* **Intelligent Organization:** Manage all your local video courses and playlists in one sleek, visual library.
* **Persistent Metadata:** Add custom cover images, descriptions, and tags to your courses. All metadata is securely stored in MongoDB and instantly available across devices.
* **Automated Metrics:** Automatically track total modules, video counts, and document counts for every uploaded course folder.

### 🧠 Deep Learning Workspace
* **Granular Video Sync:** Progress isn't just tracked at the course level. Course Flow remembers the exact timestamp you paused *each individual video*.
* **Contextual Data Pods:** Every single video module has its own dedicated, cloud-backed storage for:
    * **Notes:** Jot down key takeaways while watching.
    * **Tasks:** Action items specific to that exact video.
    * **Doubts:** Track unanswered questions and mark them as resolved later.
* **Course-Wide Goals:** Set macro-level objectives for the entire course that remain visible no matter which module you are currently studying.

### 🎯 Master Productivity Planner (The Goals Dashboard)
A centralized hub to map out your educational trajectory, featuring three distinct views:

* **Daily Execution View:** See exactly what subjects to tackle today. Features an interactive timeline, daily focus mantras, and real-time radial progress trackers for your featured courses.
* **Weekly Configuration:** Plan your week down to the subject level.
    * Link specific local courses directly to your daily schedule.
    * **Action Links:** Attach custom external URLs (like Notion docs, Google Calendars, or specific toolsets) directly to your daily subjects for instant access.
* **Monthly Calendar:** Add, track, and manage long-term events (exams, project deadlines, team meetings) with visual indicators on a custom-built interactive calendar.
* **Daily Check-Ins:** A robust habit-tracking system that logs your daily task completions to the database, ensuring your streak is never lost.

### ⚙️ Seamless Cloud Infrastructure
* **True Multi-Device Sync:** Built on a customized MongoDB architecture. Everything from a checked-off task on Tuesday to a newly added calendar event is instantly synchronized.
* **Preference Persistence:** Your choice of UI theme (Dark/Light Mode) is tied to your user profile, not just your browser cache. Your environment follows you.
* **Secure Authentication:** Robust JWT-based security ensures your learning data and personal schedules remain entirely private.

---

## 🎨 UI/UX Design Philosophy

Course Flow is built with a modern, glassmorphism-inspired aesthetic optimized for deep focus. 

* **Distraction-Free:** Heavy use of blurs, deep contrasts, and subtle gradients (specifically in Dark Mode) keep the focus entirely on the learning material.
* **Scannability:** Information hierarchy is strictly maintained through floating tab switchers, animated carousels, and highly visual progress indicators.
* **Instant Feedback:** Optimistic UI updates mean checking off a task feels instantaneous, while the background gracefully handles the database synchronization.

---

## 🛠 Tech Stack

**Frontend:** React, Tailwind CSS, Lucide Icons, Vite
**Backend:** Node.js, Express.js
**Database:** MongoDB Atlas, Mongoose
**Authentication:** JSON Web Tokens (JWT)
