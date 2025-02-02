const sql = require("mssql");
const dbConfig = require("../dbConfig");

const signup = async (req, res) => {
    const { username, password } = req.body;

    try {
        const pool = await sql.connect(dbConfig);

        // Check if the username already exists
        const result = await pool.request()
            .input("username", sql.VarChar, username)
            .query("SELECT * FROM Users WHERE username = @username");

        if (result.recordset.length > 0) {
            return res.status(400).json({ message: "Username already exists" });
        }

        // Insert the new user with role 'user'
        await pool.request()
            .input("username", sql.VarChar, username)
            .input("password", sql.VarChar, password)
            .query("INSERT INTO Users (username, password, role) VALUES (@username, @password, 'user')");

        // Redirect to login.html after successful signup
        return res.status(201).json({ message: "User created successfully", redirect: '/index.html' });

    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ message: "Error creating user" });
    }
};

module.exports = { signup };
