const sql = require('mssql');
const dbConfig = require('../dbConfig'); // Path to your database config file

// Function to generate a random 6-digit queue number
function generateQueueNumber() {
    return Math.floor(100000 + Math.random() * 900000); // Generates a 6-digit number
}

async function saveChatRequest(username, chatReason, otherDetails, additionalDetails) {
    try {
        const pool = await sql.connect(dbConfig);
        const queueNumber = generateQueueNumber();

        const result = await pool.request()
            .input('username', sql.VarChar, username)
            .input('chatReason', sql.VarChar, chatReason)
            .input('otherDetails', sql.Text, otherDetails)
            .input('additionalDetails', sql.Text, additionalDetails)
            .input('queueNumber', sql.Int, queueNumber)
            .query(`
                INSERT INTO chat_requests (username, chat_reason, other_details, additional_details, queue_number)
                VALUES (@username, @chatReason, @otherDetails, @additionalDetails, @queueNumber);
            `);

        return { success: true, message: 'Chat request saved successfully!', queueNumber };
    } catch (error) {
        console.error('Error saving chat request:', error);
        throw new Error('Error saving chat request to the database');
    }
}

module.exports = { saveChatRequest };