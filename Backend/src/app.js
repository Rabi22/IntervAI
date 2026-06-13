const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")

const app = express()

app.use(express.json())
app.use(cookieParser())
const allowedOrigins = [
    "http://localhost:5173", 
    "http://localhost:3000", 
    "https://intervai-backend-bdks.onrender.com",
    "https://intervai-8yx2.onrender.com"
]
if (process.env.FRONTEND_URL) {
    const envUrl = process.env.FRONTEND_URL.endsWith('/') 
        ? process.env.FRONTEND_URL.slice(0, -1) 
        : process.env.FRONTEND_URL;
    allowedOrigins.push(envUrl);
}

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    },
    credentials: true
}))

const authRouter = require("./routes/auth.routes.js")
const interviewRouter = require("./routes/interview.routes.js")

app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)



module.exports = app
