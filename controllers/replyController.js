const sql = require('mssql');
const dbConfig = require('../dbConfig');

// Get replies by thread_id, including nested replies
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

// Add a reply to a thread or a reply
async function addReply(req, res) {
    const { thread_id, author, content, parent_reply_id } = req.body;

    // Check if thread_id is valid
    if (!thread_id) {
        return res.status(400).json({ message: "Thread ID is required" });
    }

    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('thread_id', sql.Int, thread_id)
            .input('author', sql.VarChar, author)
            .input('content', sql.Text, content)
            .input('parent_reply_id', sql.Int, parent_reply_id || null)
            .query(`
                INSERT INTO Replies (thread_id, author, content, parent_reply_id, date)
                OUTPUT INSERTED.reply_id, INSERTED.author, INSERTED.content, INSERTED.date, INSERTED.parent_reply_id
                VALUES (@thread_id, @author, @content, @parent_reply_id, GETDATE())
            `);

        const newReply = result.recordset[0];
        res.status(201).json(newReply);
    } catch (error) {
        console.error("Error adding reply:", error);
        res.status(500).json({ message: "Error adding reply" });
    }
}

module.exports = {
    getRepliesByThreadId,
    addReply
};
