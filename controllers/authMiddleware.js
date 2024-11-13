const sql = require("mssql");
const dbConfig = require("../dbConfig");

async function isAdmin(req, res, next) {
    const username = req.headers.username; // Assuming username is passed in the headers
    if (!username) {
        return res.status(403).json({ message: "Access denied. No username provided." });
    }

    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input("username", sql.VarChar, username)
            .query("SELECT role FROM Users WHERE username = @username");

        const user = result.recordset[0];
        if (user && user.role === "admin") {
            next(); // User is an admin, proceed to the next middleware or route handler
        } else {
            res.status(403).json({ message: "Access denied. Admins only." });
        }
    } catch (error) {
        console.error("Error verifying admin role:", error);
        res.status(500).json({ message: "Internal server error." });
    }
}

module.exports = isAdmin;
