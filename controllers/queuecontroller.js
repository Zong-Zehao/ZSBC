const sql = require('mssql');
const dbConfig = require('../dbConfig');
const { saveChatRequest } = require('../models/queuemodel'); // Import the model function

// Controller to handle chat request form submission
async function submitChatRequest(req, res) {
    try {
        const { username, chat_reason, other_details, additional_details } = req.body;

        // Validate the required fields
        if (!username || !chat_reason || !additional_details) {
            return res.status(400).json({ message: 'Username, chat reason, and additional details are required.' });
        }

        // Check if the user has already submitted a chat request
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('username', sql.VarChar, username)
            .query('SELECT * FROM chat_requests WHERE username = @username');  // Check if a chat request already exists for this username

        console.log(result.recordset.length); // Log the length of the result recordset (number of rows returned)

        if (result.recordset.length > 0) {
            // If a record exists, the user already has a chat request
            console.log("Existing chat request found for username:", username); // Log the existing request
            return res.status(400).json({ message: 'You can only have one chat request at a time.' });
        }

        // If no existing chat request, call the model to save the new chat request into the database
        const chatRequestResult = await saveChatRequest(username, chat_reason, other_details, additional_details);

        // Send success response along with the generated queue number
        return res.status(200).json({
            message: 'Chat request saved successfully!',
            queueNumber: chatRequestResult.queueNumber
        });
    } catch (error) {
        console.error('Error handling chat request submission:', error);
        return res.status(500).json({ message: 'Error processing your chat request.' });
    }
}

module.exports = { submitChatRequest };