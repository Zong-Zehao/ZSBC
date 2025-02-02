const express = require('express');
const router = express.Router();
const waitingRoomModel = require('../models/waitingroommodel');

// Endpoint to get chat request details based on the logged-in username
router.get("/get_chat_request_details", async (req, res) => {
    try {
        const username = req.query.username;  // Assume the username is passed as a query parameter
        if (!username) {
            return res.status(400).json({ message: "Username is required" });
        }

        const chatRequestDetails = await waitingRoomModel.getChatRequestDetails(username);
        if (!chatRequestDetails) {
            return res.status(404).json({ message: "Chat request not found" });
        }

        res.status(200).json(chatRequestDetails);
    } catch (error) {
        console.error("Error fetching chat request details:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Add this route to fetch user's queue number and total queue count
router.get("/get_queue_details", async (req, res) => {
    try {
        const username = req.query.username;
        if (!username) {
            return res.status(400).json({ message: "Username is required" });
        }

        const queueDetails = await waitingRoomModel.getQueueDetails(username);
        if (!queueDetails) {
            return res.status(404).json({ message: "Chat request not found" });
        }

        res.status(200).json(queueDetails);
    } catch (error) {
        console.error("Error fetching queue details:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Endpoint to delete a chat request by username
router.delete("/delete_chat_request", async (req, res) => {
    try {
        const username = req.query.username;
        if (!username) {
            return res.status(400).json({ message: "Username is required" });
        }

        const result = await waitingRoomModel.deleteChatRequest(username);
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "Chat request not found" });
        }

        res.status(200).json({ message: "Chat request deleted successfully" });
    } catch (error) {
        console.error("Error deleting chat request:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;
