const jwt = require('jsonwebtoken')

function authUser(req,res,next){
    const token = req.cookies.token;

    if(!token){
        return res.status(401).json({
            message: "Token not provided"
        })
    }
    const decoded = jwt.verify(token,process.env.JWT_SECRET)
}