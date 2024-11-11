const sql = require('mssql');
const dbConfig = require('../dbConfig');

// Get replies by thread_id, including nested replies and calculate total likes and dislikes
async function getRepliesByThreadId(req, res) {
    const thread_id = req.params.thread_id;
    try {
        const pool = await sql.connect(dbConfig);

        // Fetch replies for the thread
        const repliesResult = await pool.request()
            .input('thread_id', sql.Int, thread_id)
            .query("SELECT * FROM Replies WHERE thread_id = @thread_id ORDER BY date ASC");

        // Calculate total likes and dislikes for all replies in the thread
        const likesDislikesResult = await pool.request()
            .input('thread_id', sql.Int, thread_id)
            .query(`
                SELECT 
                    SUM(likes) AS totalLikes, 
                    SUM(dislikes) AS totalDislikes 
                FROM Replies 
                WHERE thread_id = @thread_id
            `);

        const replies = repliesResult.recordset;
        const { totalLikes, totalDislikes } = likesDislikesResult.recordset[0];

        // Return both replies and total likes/dislikes
        res.json({
            replies,
            totalLikes: totalLikes || 0, // Default to 0 if null
            totalDislikes: totalDislikes || 0
        });
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

// Like or dislike a reply
async function likeReply(req, res) {
    const { reply_id } = req.params;
    const { action, username } = req.body;  // 'like' or 'dislike' and username

    try {
        const pool = await sql.connect(dbConfig);

        // Get the reply and its author
        const replyResult = await pool.request()
            .input("reply_id", sql.Int, reply_id)
            .query("SELECT author FROM Replies WHERE reply_id = @reply_id");

        if (!replyResult.recordset.length) {
            return res.status(404).json({ message: "Reply not found" });
        }

        const replyAuthor = replyResult.recordset[0].author;
        
        // Check if the user is the author of the reply
        if (replyAuthor === username) {
            return res.status(403).json({ message: "You cannot like or dislike your own reply" });
        }

        // Check if the user has already reacted to this reply
        const existingReaction = await pool.request()
            .input("reply_id", sql.Int, reply_id)
            .input("username", sql.VarChar, username)
            .query("SELECT reaction_type FROM ReplyReactions WHERE reply_id = @reply_id AND username = @username");

        if (existingReaction.recordset.length) {
            const currentReaction = existingReaction.recordset[0].reaction_type;

            if (currentReaction === action) {
                return res.status(403).json({ message: `You have already ${action}d this reply` });
            } else {
                // Update the reaction if the user wants to switch between like and dislike
                await pool.request()
                    .input("reply_id", sql.Int, reply_id)
                    .input("username", sql.VarChar, username)
                    .input("reaction_type", sql.VarChar, action)
                    .input("reacted_to", sql.VarChar, replyAuthor)
                    .query("UPDATE ReplyReactions SET reaction_type = @reaction_type, reacted_to = @reacted_to WHERE reply_id = @reply_id AND username = @username");

                // Adjust like and dislike counts
                const incrementField = action === 'like' ? 'likes' : 'dislikes';
                const decrementField = action === 'like' ? 'dislikes' : 'likes';
                await pool.request()
                    .input("reply_id", sql.Int, reply_id)
                    .query(`UPDATE Replies SET ${incrementField} = ${incrementField} + 1, ${decrementField} = ${decrementField} - 1 WHERE reply_id = @reply_id`);

                return res.status(200).json({ message: `Successfully switched to ${action} for the reply` });
            }
        } else {
            // Add a new reaction if none exists
            await pool.request()
                .input("reply_id", sql.Int, reply_id)
                .input("username", sql.VarChar, username)
                .input("reaction_type", sql.VarChar, action)
                .input("reacted_to", sql.VarChar, replyAuthor)
                .query("INSERT INTO ReplyReactions (reply_id, username, reaction_type, reacted_to) VALUES (@reply_id, @username, @reaction_type, @reacted_to)");

            // Increment the like or dislike count
            const likeDislikeField = action === 'like' ? 'likes' : 'dislikes';
            await pool.request()
                .input("reply_id", sql.Int, reply_id)
                .query(`UPDATE Replies SET ${likeDislikeField} = ${likeDislikeField} + 1 WHERE reply_id = @reply_id`);

            return res.status(200).json({ message: `${action}d reply successfully` });
        }
    } catch (error) {
        console.error("Error liking/disliking reply:", error);
        res.status(500).json({ message: "Error liking/disliking reply" });
    }
}

module.exports = {
    getRepliesByThreadId,
    addReply,
    deleteReply,
    likeReply
};
