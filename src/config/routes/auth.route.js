const express = require('express')

const authRoute = express.Router()

/**
 * @route POST /api/auth/register
 * @description Regiater a new user
 * @access Public
 */

authRoute.post("/register",authController.registerUserController)

module.exports = authRoute