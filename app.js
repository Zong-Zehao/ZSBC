const express = require("express");
const bodyParser = require("body-parser");
const sql = require("mssql");
const dbConfig = require("./dbConfig");
const app = express();
const port = 3000;
const userController = require("./controllers/userController");
const { createThread, deleteThread } = require("./controllers/threadController"); // Import corrected controller

const { getThreads, getThreadById } = require('./controllers/shownewthreadcontroller');
const isAdmin = require("./controllers/authMiddleware");
const { getRepliesByThreadId, addReply, deleteReply, likeReply, likeThread, dislikeThread} = require("./controllers/replyController");


const staticMiddleware = express.static("public");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(staticMiddleware);

// User login route
app.post("/users/login", userController.login);

// Get reputation for each user
app.get("/users/:username/reputation", userController.getUserReputation);

// Thread routes
app.post("/threads", createThread);
app.get("/threads", getThreads);
app.get("/threads/:thread_id", getThreadById);

app.delete("/threads/:thread_id", deleteThread); // Delete thread route
app.post("/threads/:thread_id/like", likeThread);
app.post("/threads/:thread_id/dislike", dislikeThread);
// Reply routes
app.get("/threads/:thread_id/replies", getRepliesByThreadId);
app.post("/threads/:thread_id/replies", addReply);
app.delete("/replies/:reply_id", deleteReply);
app.post("/replies/:reply_id/likes", likeReply);

// Admin-only routes
app.get('/admin/threads', isAdmin, async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request().query("SELECT * FROM Threads");
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error("Error fetching threads for admin:", error);
        res.status(500).json({ message: "Error retrieving threads" });
    }
});

app.delete('/admin/threads/:thread_id', isAdmin, async (req, res) => {
    const { thread_id } = req.params;
    try {
        const pool = await sql.connect(dbConfig);

        // Delete replies associated with the thread
        await pool.request()
            .input("thread_id", sql.Int, thread_id)
            .query("DELETE FROM Replies WHERE thread_id = @thread_id");

        // Delete the thread
        await pool.request()
            .input("thread_id", sql.Int, thread_id)
            .query("DELETE FROM Threads WHERE thread_id = @thread_id");

        res.status(200).json({ message: "Thread deleted successfully by admin." });
    } catch (error) {
        console.error("Error deleting thread by admin:", error);
        res.status(500).json({ message: "Failed to delete thread." });
    }
});

app.delete('/admin/replies/:reply_id', isAdmin, async (req, res) => {
    const { reply_id } = req.params;
    try {
        const pool = await sql.connect(dbConfig);

        // Delete the reply
        await pool.request()
            .input("reply_id", sql.Int, reply_id)
            .query("DELETE FROM Replies WHERE reply_id = @reply_id");

        res.status(200).json({ message: "Reply deleted successfully by admin." });
    } catch (error) {
        console.error("Error deleting reply by admin:", error);
        res.status(500).json({ message: "Failed to delete reply." });
    }
});
app.delete('/admin/replies/:reply_id', isAdmin, async (req, res) => {
    const { reply_id } = req.params;
    try {
        const pool = await sql.connect(dbConfig);

        // Delete the reply
        await pool.request()
            .input("reply_id", sql.Int, reply_id)
            .query("DELETE FROM Replies WHERE reply_id = @reply_id");

        res.status(200).json({ message: "Reply deleted successfully by admin." });
    } catch (error) {
        console.error("Error deleting reply by admin:", error);
        res.status(500).json({ message: "Failed to delete reply." });
    }
});


app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
