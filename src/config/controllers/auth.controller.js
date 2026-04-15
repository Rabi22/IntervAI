const userModel = require("../models/user.model")
const bcrypt = require("bcrypt.js")
const jwt = require("jsonwebtoken")

/**
 * @name registerUserController
 * @description register a new user
 * @access Public
 */

async function registerUserController(req,res) {
    const {username,email,password} = req.body

    if(!username || !email || !password){
        return res.status(400).json({
            message : "Please provide username , email & password"
        })
    }

    const isUserAlreadyExists = await userModel.findOne({
        $or : [{username},{email}]
    })

    if(isUserAlreadyExists){
        return res.status(400).json({
            message:"Account with this username or email address already exists"
        })
    }

    const hash = await bcrypt.hash(password,10) //10 is cost factor or salt rounds here.

    const user = await userModel.create({
        username,
        email,
        password:hash
    })

    const token_username = jwt.sign(
        {
            // payload
            id:user._id,
            username:user.username
        },
        process.env.JWT_SECRET,
        {expiresIn:"1d"}
    )
    res.cookie("token",token_username)

    res.status(201).json({
        message:"User logged in successfully",
        user:{
            id:user._id,
            username:user.username,
            email:user.email
        }
    })
}

/**
 * @name loginUserController
 * @description user login
 * @access Public
 */

async function loginUserController(req,res){
    const {email,password} = req.body;

    const user = await userModel.findOne({email})

    if(!user){
        return res.status(400).json({message:"Invalid email or password"})
    }
    const isPasswdValid = await bcrypt.compare(password,user.password)

    if(!isPasswdValid){
        return res.status(400).json({
            message: "Invalid email or password"
        })
    }

    const token_Passwd = jwt.sign(
        {
            id:user._id,
            username:user.username,
        },
        process.env.JWT_SECRET,
        {expiresIn:"1d"}
    )
    res.cookie("token",token_Passwd);
    res.status(200).json({
        message:"User logged in Successfully",
        user:{
            id:user._id,
            username:user.username,
            email:user.email
            
        }
    })
}

module.exports = {
    registerUserController,
    loginUserController
}