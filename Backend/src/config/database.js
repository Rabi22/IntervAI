const mongoose = require("mongoose");

async function connectDB(){
    try {
        await mongoose.connect(process.env.mongo_url);
        console.log("Connected to DB")
    } catch (error) {
        console.error("Database connection failed:", error.message)
        throw error
    }
}

module.exports = connectDB