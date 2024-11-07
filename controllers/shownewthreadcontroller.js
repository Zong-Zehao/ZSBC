const shownewthreadmodel = require('../models/shownewthreadmodel');

async function getThreads(req, res) {
    try {
        const threads = await shownewthreadmodel.getAllThreads();
        res.status(200).json(threads);
    } 
    catch (error) {
        res.status(500).json({ message: "Error retrieving threads" });
    }
}

module.exports = {
    getThreads
};