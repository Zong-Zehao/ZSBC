const ReplyModel = require("../models/replyModel");

async function createReply(req, res) {
    const { thread_id, author, content } = req.body;

    if (!thread_id || !author || !content) {
        return res.status(400).send({ message: "All fields are required." });
    }

    const result = await ReplyModel.createReply(thread_id, author, content);
    if (result.success) {
        res.status(201).send(result);
    } else {
        res.status(500).send(result);
    }
}

async function getReplies(req, res) {
    const { thread_id } = req.params;

    const replies = await ReplyModel.getRepliesByThreadId(thread_id);
    if (replies) {
        res.status(200).send(replies);
    } else {
        res.status(500).send({ message: "Error retrieving replies." });
    }
}

module.exports = {
    createReply,
    getReplies
};
