const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        unique:[true,"Username already taken"]
    },
    email:{
        type:String,
        unique:[true,"Account already exists with this Email ID"],
        required:true
    },
    password:{
        type:String,
        required:true
    }
})

const userModel = mongoose.model("users",userSchema);
module.exports = userModel 
