const shownewthreadmodel = require('../models/shownewthreadmodel');

async function getThreads(req, res) {
    try {
        const threads = await shownewthreadmodel.getAllThreads();
        res.status(200).json(threads);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving threads" });
    }
}

async function getThreadById(req, res) {
    try {
        const thread_id = req.params.thread_id;
        const thread = await shownewthreadmodel.getThreadById(thread_id);
        if (thread) {
            res.status(200).json(thread);
        } else {
            res.status(404).json({ message: "Thread not found" });
        }
    } catch (error) {
        res.status(500).json({ message: "Error retrieving thread" });
    }
}

module.exports = {
    getThreads,
    getThreadById
};
