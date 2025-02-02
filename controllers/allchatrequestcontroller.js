const sql = require('mssql');
const dbConfig = require('../dbConfig');
const { getAllChatRequests } = require('../models/allchatrequestmodel');

// Controller function to handle GET request for all chat requests
async function fetchAllChatRequests(req, res) {
    try {
        const chatRequests = await getAllChatRequests();
        res.status(200).json(chatRequests);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving chat requests" });
    }
}

// Controller function to accept a chat request
async function acceptChatRequest(req, res) {
    const { id } = req.params;
    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input("id", sql.Int, id)
            .query("UPDATE chat_requests SET status = 'accepted' WHERE id = @id");

        res.status(200).json({ message: "Chat request accepted" });
    } catch (error) {
        console.error("Error accepting chat request:", error);
        res.status(500).json({ message: "Failed to update chat request status" });
    }
}

module.exports = { fetchAllChatRequests, acceptChatRequest };