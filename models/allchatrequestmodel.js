const sql = require('mssql');
const dbConfig = require('../dbConfig'); // Path to your database config file

// Function to get all chat requests
async function getAllChatRequests() {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request().query("SELECT * FROM chat_requests ORDER BY created_at DESC");
        return result.recordset;
    } catch (error) {
        console.error("Error fetching chat requests:", error);
        throw error;
    }
}

module.exports = { getAllChatRequests };