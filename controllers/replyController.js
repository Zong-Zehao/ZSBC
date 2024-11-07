const sql = require('mssql');
const dbConfig = require('../dbConfig');

// Get replies by thread_id
async function getRepliesByThreadId(req, res) {
    const thread_id = req.params.thread_id;
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('thread_id', sql.Int, thread_id)
            .query("SELECT * FROM Replies WHERE thread_id = @thread_id ORDER BY date ASC");

        res.json(result.recordset);
    } catch (error) {
        console.error("Error fetching replies:", error);
        res.status(500).json({ message: "Error retrieving replies" });
    }
}

// Add a reply to a thread
async function addReply(req, res) {
    const { author, content } = req.body;
    const thread_id = req.params.thread_id;
    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input('thread_id', sql.Int, thread_id)
            .input('author', sql.VarChar, author)
            .input('content', sql.Text, content)
            .query("INSERT INTO Replies (thread_id, author, content) VALUES (@thread_id, @author, @content)");

        res.status(201).json({ message: "Reply added successfully!" });
    } catch (error) {
        console.error("Error adding reply:", error);
        res.status(500).json({ message: "Error adding reply" });
    }
}

module.exports = {
    getRepliesByThreadId,
    addReply
};
