const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 3000;
const userController = require("./controllers/userController");
const { createThread, deleteThread } = require("./controllers/threadController"); // Import corrected controller
const { getThreads, getThreadById } = require('./controllers/shownewthreadcontroller'); 
const { getRepliesByThreadId, addReply, deleteReply, likeReply, likeThread, dislikeThread} = require("./controllers/replyController");

const staticMiddleware = express.static("public");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(staticMiddleware);

// User login route
app.post("/users/login", userController.login);

// Thread routes
app.post("/threads", createThread);
app.get("/threads", getThreads);
app.get("/threads/:thread_id", getThreadById);
app.delete("/threads/:thread_id", deleteThread); // Delete thread route
app.post("/threads/:thread_id/like", likeThread);
app.post("/threads/:thread_id/dislike", dislikeThread);

// Reply routes
app.get("/threads/:thread_id/replies", getRepliesByThreadId);
app.post("/threads/:thread_id/replies", addReply);
app.delete("/replies/:reply_id", deleteReply); // Delete reply route
app.post("/replies/:reply_id/likes", likeReply);


app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
