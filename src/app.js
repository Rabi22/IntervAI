const express = require("express");
const app = express();

app.use(express.json());

// Require all routes
const authRoute = require("./config/routes/auth.route")

// Using all routes
app.use("/api/auth",authRoute)

module.exports = app;