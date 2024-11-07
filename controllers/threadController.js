const threadModel = require('../models/threadModel');

async function createThread(req, res) {
    const { title, content, username } = req.body;

    if (!title || !content || !username) {
        return res.status(400).send({ message: 'All fields are required.' });
    }

    const result = await threadModel.createThread(title, content, username);
    if (result.success) {
        res.status(201).send(result);
    } else {
        res.status(500).send(result);
    }
}

module.exports = {
    createThread,
};


