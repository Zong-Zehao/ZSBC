const sql = require("mssql");
const dbConfig = require("../dbConfig");

// Create a new thread
async function createThread(req, res) {
    const { title, content, username } = req.body;

    if (!title || !content || !username) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    try {
        const pool = await sql.connect(dbConfig);
        await pool
            .request()
            .input("title", sql.VarChar, title)
            .input("content", sql.Text, content)
            .input("username", sql.VarChar, username)
            .query(
                "INSERT INTO Threads (title, content, username) VALUES (@title, @content, @username)"
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
        const thread = await pool
            .request()
            .input("thread_id", sql.Int, thread_id)
            .query("SELECT username FROM Threads WHERE thread_id = @thread_id");

        if (!thread.recordset.length) {
            return res.status(404).json({ message: "Thread not found" });
        }

        const threadAuthor = thread.recordset[0].username;
        if (threadAuthor !== username) {
            return res.status(403).json({ message: "You can only delete your own threads" });
        }

        await pool
            .request()
            .input("thread_id", sql.Int, thread_id)
            .query("DELETE FROM Threads WHERE thread_id = @thread_id");

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
