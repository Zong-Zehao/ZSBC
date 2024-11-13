const sql = require("mssql");
const dbConfig = require("../dbConfig");

// Create a new thread
async function createThread(req, res) {
    const { title, content, username, category } = req.body;

    if (!title || !content || !username || !category) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    try {
        const pool = await sql.connect(dbConfig);
        await pool
            .request()
            .input("title", sql.VarChar, title)
            .input("content", sql.Text, content)
            .input("username", sql.VarChar, username)
            .input("category", sql.VarChar, category)  // New input for category
            .query(
                "INSERT INTO Threads (title, content, username, category) VALUES (@title, @content, @username, @category)"
            );

        res.status(201).json({ message: "Thread created successfully!" });
    } catch (error) {
        console.error("Error creating thread:", error);
        res.status(500).json({ message: "Failed to create thread" });
    }
}

// Delete a thread
async function deleteThread(req, res) {
    const { thread_id } = req.params;
    const { username } = req.body;

    try {
        const pool = await sql.connect(dbConfig);

        // Debug user role and username
        console.log(`Username: ${username}, Thread ID: ${thread_id}`);

        // Check the user's role
        const userResult = await pool.request()
            .input("username", sql.VarChar, username)
            .query("SELECT role FROM Users WHERE username = @username");

        if (userResult.recordset.length === 0) {
            console.log("User not found");
            return res.status(403).json({ message: "User not found" });
        }

        const user = userResult.recordset[0];
        const isAdmin = user.role === "admin";
        console.log(`User Role: ${user.role}, Is Admin: ${isAdmin}`);

        // Check thread ownership or admin privilege
        const threadResult = await pool.request()
            .input("thread_id", sql.Int, thread_id)
            .query("SELECT username FROM Threads WHERE thread_id = @thread_id");

        if (threadResult.recordset.length === 0) {
            console.log("Thread not found");
            return res.status(404).json({ message: "Thread not found" });
        }

        const thread = threadResult.recordset[0];
        console.log(`Thread Owner: ${thread.username}, Admin: ${isAdmin}, Requester: ${username}`);

        // Allow deletion if admin or thread owner
        if (!isAdmin && thread.username !== username) {
            console.log("Permission denied: Not admin or owner");
            return res.status(403).json({ message: "You can only delete your own threads" });
        }

        // Delete replies associated with the thread
        await pool.request()
            .input("thread_id", sql.Int, thread_id)
            .query("DELETE FROM Replies WHERE thread_id = @thread_id");

        // Delete the thread
        await pool.request()
            .input("thread_id", sql.Int, thread_id)
            .query("DELETE FROM Threads WHERE thread_id = @thread_id");

        console.log("Thread deleted successfully");
        res.status(200).json({ message: "Thread deleted successfully" });
    } catch (error) {
        console.error("Error deleting thread:", error);
        res.status(500).json({ message: "Failed to delete thread" });
    }
}

module.exports = {
    createThread,
    deleteThread,
};
