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

// Add a reply to a thread or a reply
async function addReply(req, res) {
    const { thread_id, author, content, parent_reply_id } = req.body;

    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('thread_id', sql.Int, thread_id)
            .input('author', sql.VarChar, author)
            .input('content', sql.Text, content)
            .input('parent_reply_id', sql.Int, parent_reply_id || null)
            .query(`INSERT INTO Replies (thread_id, author, content, parent_reply_id, date)
                    OUTPUT INSERTED.reply_id, INSERTED.author, INSERTED.content, INSERTED.date, INSERTED.parent_reply_id
                    VALUES (@thread_id, @author, @content, @parent_reply_id, GETDATE())`);

        res.status(201).json(result.recordset[0]);
    } catch (error) {
        console.error("Error adding reply:", error);
        res.status(500).json({ message: "Error adding reply" });
    }
}

// Delete a reply
async function deleteReply(req, res) {
    const { reply_id } = req.params;
    const { username } = req.body;

    try {
        const pool = await sql.connect(dbConfig);
        const reply = await pool
            .request()
            .input("reply_id", sql.Int, reply_id)
            .query("SELECT author FROM Replies WHERE reply_id = @reply_id");

        if (!reply.recordset.length) {
            return res.status(404).json({ message: "Reply not found" });
        }

        const replyAuthor = reply.recordset[0].author;
        if (replyAuthor !== username) {
            return res.status(403).json({ message: "You can only delete your own replies" });
        }

        await pool
            .request()
            .input("reply_id", sql.Int, reply_id)
            .query("DELETE FROM Replies WHERE reply_id = @reply_id");

        res.status(200).json({ message: "Reply deleted successfully" });
    } catch (error) {
        console.error("Error deleting reply:", error);
        res.status(500).json({ message: "Failed to delete reply" });
    }
}

module.exports = {
    getRepliesByThreadId,
    addReply,
    deleteReply,
};
