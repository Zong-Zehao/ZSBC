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
      
      // Redirect Admins to `admin.html`, and regular users to `mainpage.html`
      const redirectUrl = user.role === "admin" ? "/admin.html" : "/mainpage.html";

      res.json({ message: "Login successful!", token, redirect: redirectUrl });
    } else {
      console.log("Password does not match for username:", username);
      res.status(401).send("Invalid username or password");
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send("Error logging in");
  }
}

// Updated `getUserReputation` function
async function getUserReputation(req, res) {
  const { username } = req.params;

  try {
    const user = await User.getUserWithReputation(username);
    if (user) {
      res.status(200).json({ username: user.username, reputation: user.reputation });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Error fetching user reputation:", error);
    res.status(500).json({ message: "Error fetching user reputation" });
  }
}

module.exports = { login, getUserReputation};

