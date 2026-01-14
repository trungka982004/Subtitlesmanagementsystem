
  # Subtitles Management System

A comprehensive system for managing and translating subtitles with a custom NLP integration.

## 🚀 Quick Start (Windows)

If you are on a new Windows device, you can use the automated scripts:

1.  **Environment**: Copy `.env.example` to `.env` and fill in your `DATABASE_URL`.
2.  **Setup**: Double-click `setup_app.bat`. This installs all Node/Python dependencies and sets up your database.
3.  **Run**: Double-click `start_all.bat`. This starts all services in a single terminal.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation & Setup](#installation--setup)
3. [Running the Application](#running-the-application)
4. [Mock Accounts](#mock-accounts)
5. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Ensure you have the following installed on your device:
- **Node.js** (v18+)
- **PostgreSQL** (Ensure a database is created)
- **Python** (3.8+)
- **Git**

---

## Installation & Setup (Manual)

### 1. Clone & Install Node Dependencies
```bash
npm install
```

### 2. Environment Configuration
Update `.env` with your PostgreSQL credentials.

### 3. Database Setup
```bash
npx prisma generate
npx prisma db push
npm run seed
```

### 4. NLP Service Setup (Python)
```bash
pip install -r server/python_service/requirements.txt
```

---

## Running the Application

### Unified Start (Recommended)
```bash
npm run start:all
```

### Individual Processes
If you prefer running them in separate terminals:
1. **Backend:** `npm run server`
2. **Frontend:** `npm run dev`
3. **Mock Translator:** `python scripts/mock_libretranslate.py`
4. **NLP Service:** `cd server/python_service && python main.py`

---

## Mock Accounts

Use these pre-seeded accounts:
- **John:** `john@example.com` / `password123`
- **Trung:** `trung@example.com` / `123456`
- **Admin:** `admin@example.com` / `password`

---

## Troubleshooting

- **Database Connection:** Ensure your PostgreSQL server is running and the database specified in `.env` exists.
- **Python Path:** Ensure `python` is in your System PATH.
- **Ports:** Check if ports 3000, 3001, 3002, and 8000 are available.
- **Large Files:** The NLP model files (~300MB) are too large for standard GitHub tracking. If you fetch this project and the `server/python_service/model` folder is empty, you must manually copy the model files from your original device.

