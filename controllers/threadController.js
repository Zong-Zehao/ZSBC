const sql = require("mssql");
const dbConfig = require("../dbConfig");

// Define the function to detect sensitive data
const sensitivePatterns = [
  /\b\d{8}\b/, // Phone numbers
  /\b(?:\d{4}-){3}\d{4}|\d{16}\b/, // Credit card numbers
  /\b\d{4}\b/ // PIN numbers
];

function containsSensitiveData(content) {
  return sensitivePatterns.some((pattern) => pattern.test(content));
}

// Create a new thread
async function createThread(req, res) {
  const { title, content, username, category } = req.body;

  if (!title || !content || !username || !category) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  if (containsSensitiveData(content)) {
    return res.status(400).json({
      message: "Thread contains either a phone number or sensitive banking information. Please remove it before posting.",
    });
  }

  try {
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input("title", sql.VarChar, title)
      .input("content", sql.Text, content)
      .input("username", sql.VarChar, username)
      .input("category", sql.VarChar, category)
      .query("INSERT INTO Threads (title, content, username, category) VALUES (@title, @content, @username, @category)");

    res.status(201).json({ message: "Thread created successfully!" });
  } catch (error) {
    console.error("Error creating thread:", error.message, { stack: error.stack });
    res.status(500).json({ message: "Internal server error. Please try again later." });
  }
}
  

// Combined function to delete a thread along with all its replies (including nested replies) and reactions
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

        // Recursive function to delete replies, nested replies, and reactions
        const deleteRepliesAndReactions = async (thread_id) => {
            // Delete reactions for the replies
            await pool.request()
                .input("thread_id", sql.Int, thread_id)
                .query("DELETE FROM ReplyReactions WHERE reply_id IN (SELECT reply_id FROM Replies WHERE thread_id = @thread_id)");

            // Delete the replies (including nested replies)
            const repliesResult = await pool.request()
                .input("thread_id", sql.Int, thread_id)
                .query("SELECT reply_id FROM Replies WHERE thread_id = @thread_id");

            for (let reply of repliesResult.recordset) {
                // Recursively delete nested replies and reactions
                await deleteNestedRepliesAndReactions(reply.reply_id);
            }

            // Delete the replies themselves
            await pool.request()
                .input("thread_id", sql.Int, thread_id)
                .query("DELETE FROM Replies WHERE thread_id = @thread_id");
        };

        // Recursive function to delete nested replies and reactions
        const deleteNestedRepliesAndReactions = async (reply_id) => {
            // Delete reactions for the reply
            await pool.request()
                .input("reply_id", sql.Int, reply_id)
                .query("DELETE FROM ReplyReactions WHERE reply_id = @reply_id");

            // Get nested replies for the current reply
            const nestedRepliesResult = await pool.request()
                .input("reply_id", sql.Int, reply_id)
                .query("SELECT reply_id FROM Replies WHERE parent_reply_id = @reply_id");

            for (let nestedReply of nestedRepliesResult.recordset) {
                // Recursively delete nested replies and their reactions
                await deleteNestedRepliesAndReactions(nestedReply.reply_id);
            }

            // Finally delete the nested replies
            await pool.request()
                .input("reply_id", sql.Int, reply_id)
                .query("DELETE FROM Replies WHERE reply_id = @reply_id");
        };

        // Delete replies and nested replies along with reactions
        await deleteRepliesAndReactions(thread_id);

        // Delete the thread itself
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
