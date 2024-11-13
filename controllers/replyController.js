const sql = require('mssql');
const dbConfig = require('../dbConfig');

// Get replies by thread_id, including nested replies
async function getRepliesByThreadId(req, res) {
    const thread_id = req.params.thread_id;
    try {
        const pool = await sql.connect(dbConfig);

        // Fetch replies with like and dislike counts
        const repliesResult = await pool.request()
            .input('thread_id', sql.Int, thread_id)
            .query(`
                SELECT r.*, 
                    (SELECT COUNT(*) FROM ReplyReactions rr WHERE rr.reply_id = r.reply_id AND rr.reaction_type = 'like') AS likes,
                    (SELECT COUNT(*) FROM ReplyReactions rr WHERE rr.reply_id = r.reply_id AND rr.reaction_type = 'dislike') AS dislikes
                FROM Replies r
                WHERE r.thread_id = @thread_id
                ORDER BY r.date ASC
            `);

        const replies = repliesResult.recordset;

        // Return replies with like/dislike counts
        res.json({ replies });
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

        // Check the user's role
        const userResult = await pool.request()
            .input("username", sql.VarChar, username)
            .query("SELECT role FROM Users WHERE username = @username");

        const user = userResult.recordset[0];
        if (!user) {
            return res.status(403).json({ message: "User not found" });
        }

        const isAdmin = user.role === "admin";

        // Check reply ownership or admin privilege
        const replyResult = await pool.request()
            .input("reply_id", sql.Int, reply_id)
            .query("SELECT author FROM Replies WHERE reply_id = @reply_id");

        const reply = replyResult.recordset[0];
        if (!reply) {
            return res.status(404).json({ message: "Reply not found" });
        }

        // Allow deletion if admin or reply owner
        if (reply.author !== username && !isAdmin) {
            return res.status(403).json({ message: "You can only delete your own replies" });
        }

        // Delete the reply
        await pool.request()
            .input("reply_id", sql.Int, reply_id)
            .query("DELETE FROM Replies WHERE reply_id = @reply_id");

        res.status(200).json({ message: "Reply deleted successfully" });
    } catch (error) {
        console.error("Error deleting reply:", error);
        res.status(500).json({ message: "Failed to delete reply" });
    }
}

// Like a thread
async function likeThread(req, res) {
    const { thread_id } = req.params;
    const { username } = req.body; 

    try {
        const pool = await sql.connect(dbConfig);

        // Fetch the thread owner, likes, and dislikes
        const threadResult = await pool.request()
            .input("thread_id", sql.Int, thread_id)
            .query("SELECT username AS owner, likes, dislikes FROM Threads WHERE thread_id = @thread_id");

        if (!threadResult.recordset.length) {
            return res.status(404).json({ message: "Thread not found" });
        }

        const { owner, likes, dislikes } = threadResult.recordset[0];

        // Check if the user is the thread owner
        if (username === owner) {
            return res.status(403).json({ message: "You cannot like or dislike your own thread." });
        }

        // Convert likes and dislikes from JSON format if not null
        let parsedLikes = JSON.parse(likes || "[]");
        let parsedDislikes = JSON.parse(dislikes || "[]");

        // Check if the user already liked the thread
        if (parsedLikes.includes(username)) {
            return res.status(403).json({ message: "You have already liked this thread." });
        }

        // Remove user from dislikes if they previously disliked the thread
        parsedDislikes = parsedDislikes.filter(user => user !== username);
        parsedLikes.push(username);

        // Update likes and dislikes in the Threads table
        await pool.request()
            .input("thread_id", sql.Int, thread_id)
            .input("likes", sql.VarChar, JSON.stringify(parsedLikes))
            .input("dislikes", sql.VarChar, JSON.stringify(parsedDislikes))
            .input("total_likes", sql.Int, parsedLikes.length)
            .input("total_dislikes", sql.Int, parsedDislikes.length)
            .query(`
                UPDATE Threads 
                SET likes = @likes, dislikes = @dislikes, 
                    total_likes = @total_likes, total_dislikes = @total_dislikes 
                WHERE thread_id = @thread_id
            `);

        res.status(200).json({ 
            message: "Thread liked successfully.",
            total_likes: parsedLikes.length,
            total_dislikes: parsedDislikes.length 
        });
    } catch (error) {
        console.error("Error liking thread:", error);
        res.status(500).json({ message: "Error liking thread" });
    }
}

// Dislike a thread
async function dislikeThread(req, res) {
    const { thread_id } = req.params;
    const { username } = req.body;

    try {
        const pool = await sql.connect(dbConfig);

        // Fetch the thread owner, likes, and dislikes
        const threadResult = await pool.request()
            .input("thread_id", sql.Int, thread_id)
            .query("SELECT username AS owner, likes, dislikes FROM Threads WHERE thread_id = @thread_id");

        if (!threadResult.recordset.length) {
            return res.status(404).json({ message: "Thread not found" });
        }

        const { owner, likes, dislikes } = threadResult.recordset[0];

        // Check if the user is the thread owner
        if (username === owner) {
            return res.status(403).json({ message: "You cannot like or dislike your own thread." });
        }

        // Convert likes and dislikes from JSON format if not null
        let parsedLikes = JSON.parse(likes || "[]");
        let parsedDislikes = JSON.parse(dislikes || "[]");

        // Check if the user already disliked the thread
        if (parsedDislikes.includes(username)) {
            return res.status(403).json({ message: "You have already disliked this thread." });
        }

        // Remove user from likes if they previously liked the thread
        parsedLikes = parsedLikes.filter(user => user !== username);
        parsedDislikes.push(username);

        // Update likes and dislikes in the Threads table
        await pool.request()
            .input("thread_id", sql.Int, thread_id)
            .input("likes", sql.VarChar, JSON.stringify(parsedLikes))
            .input("dislikes", sql.VarChar, JSON.stringify(parsedDislikes))
            .input("total_likes", sql.Int, parsedLikes.length)
            .input("total_dislikes", sql.Int, parsedDislikes.length)
            .query(`
                UPDATE Threads 
                SET likes = @likes, dislikes = @dislikes, 
                    total_likes = @total_likes, total_dislikes = @total_dislikes 
                WHERE thread_id = @thread_id
            `);

        res.status(200).json({ 
            message: "Thread disliked successfully.",
            total_likes: parsedLikes.length,
            total_dislikes: parsedDislikes.length 
        });
    } catch (error) {
        console.error("Error disliking thread:", error);
        res.status(500).json({ message: "Error disliking thread" });
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

                await updateReputations(pool, reply_id);
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

            return res.status(200).json({ message: `${action}d reply successfully` });
        }
    } catch (error) {
        console.error("Error liking/disliking reply:", error);
        res.status(500).json({ message: "Error liking/disliking reply" });
    }
}

// Update reputation for all users based on likes and dislikes
async function updateReputations(req, res) {
    try {
        const pool = await sql.connect(dbConfig);
        await pool.request().query(`
            UPDATE Users
            SET reputation = (
                SELECT COALESCE(SUM(CASE WHEN reaction_type = 'like' THEN 1 WHEN reaction_type = 'dislike' THEN -1 ELSE 0 END), 0)
                FROM ReplyReactions
                WHERE reacted_to = Users.username
            )
        `);
        
        res.status(200).json({ message: "User reputations updated successfully" });
    } catch (error) {
    }
}

module.exports = {
    getRepliesByThreadId,
    addReply,
    deleteReply,
    likeReply,
    updateReputations,
    likeThread,
    dislikeThread,
};
