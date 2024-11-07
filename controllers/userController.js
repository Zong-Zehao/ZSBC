require('dotenv').config();
const User = require("../models/user"); 
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

async function login(req, res) {
  try {
    const { username, password } = req.body;
    console.log("Login attempt with username:", username);

    const user = await User.retrieveUser(username);
    if (!user) {
      console.log("User not found for username:", username);
      return res.status(401).send("Invalid username or password");
    }

    // Direct password comparison for testing purposes
    if (password === user.password) {
      const payload = {
        username: user.username,
        role: user.role,
        reputation: user.reputation
      };

      const token = jwt.sign(payload, process.env.secretKey, { expiresIn: "1h" });

      console.log("Login successful for username:", username);
      res.json({ message: "Login successful!", token, redirect: "/mainpage.html" }); // Include redirect URL
    } else {
      console.log("Password does not match for username:", username);
      res.status(401).send("Invalid username or password");
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send("Error logging in");
  }
}

module.exports = { login };

