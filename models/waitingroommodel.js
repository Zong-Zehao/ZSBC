const sql = require('mssql');
const dbConfig = require("../dbConfig");

async function getChatRequestDetails(username) {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('username', sql.VarChar, username)
            .query(`
                SELECT username, chat_reason, other_details, additional_details, status
                FROM chat_requests
                WHERE username = @username
            `);
        return result.recordset[0];  // Return the first matching record (latest request)
    } catch (error) {
        console.error("Error fetching chat request details:", error);
        throw error;
    }
}

async function getQueueDetails(username) {
    try {
        const pool = await sql.connect(dbConfig);

        // Query to get the user's queue number and total people in the queue
        const result = await pool.request()
            .input('username', sql.VarChar, username)
            .query(`
                DECLARE @queue_number INT;
                
                -- Get the queue number for the specific user
                SELECT @queue_number = queue_number
                FROM chat_requests
                WHERE username = @username;

                -- Get the total number of people in the queue
                DECLARE @queue_count INT;
                SELECT @queue_count = COUNT(*) FROM chat_requests;
                
                SELECT @queue_number AS queue_number, @queue_count AS queue_count;
            `);
        
        // Return the queue number and queue count
        return result.recordset[0];
    } catch (error) {
        console.error("Error fetching queue details:", error);
        throw error;
    }
}

async function deleteChatRequest(username) {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('username', sql.VarChar, username)
            .query(`
                DELETE FROM chat_requests WHERE username = @username
            `);
        return result;
    } catch (error) {
        console.error("Error deleting chat request:", error);
        throw error;
    }
}

module.exports = {
    getChatRequestDetails,
    getQueueDetails,
    deleteChatRequest
};
