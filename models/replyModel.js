const sql = require("mssql");
const dbConfig = require("../dbConfig");

class ReplyModel {
  static async createReply(thread_id, author, content) {
    try {
      const pool = await sql.connect(dbConfig);
      const result = await pool
        .request()
        .input("thread_id", sql.Int, thread_id)
        .input("author", sql.VarChar, author)
        .input("content", sql.Text, content).query(`
                    INSERT INTO Replies (thread_id, author, content)
                    VALUES (@thread_id, @author, @content);
                `);

      return { success: true, message: "Reply created successfully." };
    } catch (error) {
      console.error("Error creating reply:", error);
      return { success: false, message: "Failed to create reply." };
    }
  }

  static async getRepliesByThreadId(thread_id) {
    try {
      const pool = await sql.connect(dbConfig);
      const result = await pool.request().input("thread_id", sql.Int, thread_id)
        .query(`
                    SELECT * FROM Replies
                    WHERE thread_id = @thread_id
                    ORDER BY date ASC;
                `);

      return result.recordset; // Array of replies for the specified thread
    } catch (error) {
      console.error("Error retrieving replies:", error);
      return null;
    }
  }
}

module.exports = ReplyModel;
