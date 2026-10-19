require("dotenv").config();
const app = require("./src/app")
const connectDB = require("./src/config/database")

const PORT = process.env.PORT || 3000;

async function startServer() {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is required.")
    }
    if (!process.env.mongo_url) {
        throw new Error("mongo_url is required.")
    }

    await connectDB()
    app.listen(PORT, () => {
        console.log(`Server running on Port ${PORT}`)
    })
}

startServer().catch((error) => {
    console.error("Server failed to start:", error.message)
    process.exitCode = 1
})