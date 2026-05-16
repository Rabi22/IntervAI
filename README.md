# InterviewAI

An AI-powered interview preparation platform. Paste a job description, upload your resume, and get a personalized interview strategy — tailored technical questions, behavioral questions, a day-by-day prep roadmap, skill gap analysis, and a generated resume PDF.

![License](https://img.shields.io/badge/license-ISC-blue.svg)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)
![Node](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb)
![Gemini](https://img.shields.io/badge/Google-Gemini_AI-4285F4?logo=google)

---

## What It Does

You paste a job description and upload your resume (PDF, DOCX, or TXT) or write a quick self-description. Gemini AI analyzes both and returns:

- **Match score** — how well your profile fits the job (0–100)
- **Technical questions** — tailored to the role, with the interviewer's intent and a model answer
- **Behavioral questions** — with STAR-method-aligned answers
- **Skill gap analysis** — what you're missing and how critical each gap is
- **Day-by-day preparation roadmap** — a focused study plan before the interview
- **Generated resume PDF** — an ATS-friendly resume tailored to the job, built from your profile

All reports are saved and accessible from your dashboard.

---

## Tech Stack

**Frontend**
- React 19 + Vite 8
- React Router v7
- Tailwind CSS v4 + SCSS
- Axios + React Hot Toast

**Backend**
- Node.js + Express 5
- Google Gemini AI (`gemini-2.5-flash` / `gemini-3-flash-preview`)
- MongoDB + Mongoose
- JWT authentication with cookie-based sessions
- Token blacklisting on logout
- Multer (file upload, memory storage, 3MB limit)
- pdf-parse + Mammoth (resume text extraction from PDF / DOCX / TXT)
- Puppeteer (HTML-to-PDF resume generation)
- Zod (schema validation + structured AI output)

---

## Project Structure

```
├── Backend/
│   ├── server.js                        # Entry point
│   └── src/
│       ├── app.js                       # Express app setup, CORS, middleware
│       ├── config/
│       │   ├── database.js              # MongoDB connection
│       │   ├── models/
│       │   │   ├── user.model.js
│       │   │   ├── InterviewReport.Model.js
│       │   │   └── blacklist.model.js   # JWT token blacklist
│       │   ├── controllers/
│       │   │   └── auth.controller.js
│       │   └── routes/
│       │       └── auth.route.js
│       ├── controller/
│       │   └── interview.controller.js
│       ├── middleware/
│       │   ├── auth.middleware.js       # JWT verification + blacklist check
│       │   └── file.middleware.js       # Multer config
│       ├── routes/
│       │   ├── auth.routes.js
│       │   └── interview.routes.js
│       └── services/
│           └── ai.service.js            # Gemini AI calls + Puppeteer PDF gen
│
└── Frontend/
    ├── src/
    │   ├── features/
    │   │   ├── auth/                    # Login, Register, Protected route wrapper
    │   │   │   ├── components/
    │   │   │   ├── hooks/useAuth.js
    │   │   │   ├── pages/
    │   │   │   └── services/auth.api.js
    │   │   └── interview/               # Core interview feature
    │   │       ├── hooks/useInterview.js
    │   │       ├── pages/
    │   │       │   ├── Home.jsx         # Report generation form + report list
    │   │       │   └── Interview.jsx    # Report viewer (questions, roadmap, sidebar)
    │   │       ├── services/Interview.api.jsx
    │   │       └── style/
    │   ├── App.jsx
    │   ├── app.routes.jsx
    │   └── main.jsx
    └── vite.config.js
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- A MongoDB Atlas cluster (or local MongoDB)
- A Google Gemini API key ([get one here](https://aistudio.google.com))

### 1. Clone the repo

```bash
git clone https://github.com/your-username/interview-ai.git
cd interview-ai
```

### 2. Backend setup

```bash
cd Backend
npm install
```

Create a `.env` file in the `Backend/` directory:

```env
mongo_url=your_mongodb_connection_string
JWT_SECRET=your_strong_random_secret
GEMINI_API_KEY=your_gemini_api_key
```

Start the backend:

```bash
npm run dev       # development (nodemon)
node server.js    # production
```

The server runs on `http://localhost:3000`.

### 3. Frontend setup

```bash
cd Frontend
npm install
npm run dev
```

The app runs on `http://localhost:5173`.

---

## API Reference

### Auth — `/api/auth`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/register` | Public | Create a new account |
| POST | `/login` | Public | Log in, receive HTTP-only cookie |
| GET | `/logout` | Public | Clear cookie, blacklist token |
| GET | `/get-me` | Private | Get current user details |

### Interview — `/api/interview`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/` | Private | Generate report (multipart: `resume` file + `jobDescription` + `selfDescription`) |
| GET | `/` | Private | Get all reports for logged-in user (list view, heavy fields excluded) |
| GET | `/report/:interviewId` | Private | Get full report by ID |
| DELETE | `/:interviewId` | Private | Delete a report |
| POST | `/resume/pdf/:interviewReportId` | Private | Generate and download tailored resume PDF |

---

## How Authentication Works

- On login or register, a JWT is signed and set as an **HTTP-only cookie** (not accessible to JavaScript).
- Every protected route goes through `auth.middleware.js`, which verifies the token and checks it against a **token blacklist** stored in MongoDB.
- On logout, the token is added to the blacklist and the cookie is cleared. Replaying an old token after logout fails immediately.

---

## How the AI Pipeline Works

**Interview report generation**
1. The uploaded file is parsed server-side — pdf-parse for PDFs, Mammoth for DOCX, raw buffer decode for TXT.
2. The parsed resume text, self-description, and job description are sent to `gemini-3-flash-preview` with a strict JSON response schema.
3. The schema enforces structure: `matchScore`, `technicalQuestions`, `behavioralQuestions`, `skillGaps`, `preparationPlan`, `title`.
4. The response is validated, saved to MongoDB, and returned to the frontend.

**Resume PDF generation**
1. The stored resume text, self-description, and job description are retrieved from MongoDB.
2. They are sent to `gemini-2.5-flash`, which returns a styled HTML string — an ATS-friendly resume tailored to the target role.
3. Puppeteer renders the HTML to a PDF buffer, which is streamed back as a file download.

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `mongo_url` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing JWTs — use a long random string |
| `GEMINI_API_KEY` | Google Gemini API key |

> **Never commit your `.env` file.** Add it to `.gitignore` before your first push.

---

## Known Limitations

- No refresh token — sessions expire after 24 hours and the user must log in again.
- Puppeteer adds significant cold-start time on serverless platforms. A dedicated server or container is recommended for production.
- Resume parsing quality depends on the source file structure. Scanned PDFs (image-based, no text layer) will produce empty text and a poor report.
- The `gemini-3-flash-preview` model string may need updating as Google updates their API.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push and open a pull request

---

## License

ISC
