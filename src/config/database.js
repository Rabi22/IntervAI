const mongoose = require("mongoose");

async function connectDB(){
    try {
        await mongoose.connect(process.env.mongo_url);
        console.log("Connected to DB")
    } catch (error) {
        console.log(error)
    }
}

module.exports = connectDB