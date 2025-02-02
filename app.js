const express = require("express");
const bodyParser = require("body-parser");
const sql = require("mssql");
const dbConfig = require("./dbConfig");
const app = express();
const port = 3000;
const path = require("path");
const server = require("http").createServer(app);
const axios = require('axios'); // Make sure to require axios for HTTP requests
const multer = require('multer');
const io = require("socket.io")(server);

const userController = require("./controllers/userController");
const { createThread, deleteThread } = require("./controllers/threadController"); // Import corrected controller
const { getThreads, getThreadById } = require('./controllers/shownewthreadcontroller');
const isAdmin = require("./controllers/authMiddleware");
const { getRepliesByThreadId, addReply, deleteReply, likeReply, likeThread, dislikeThread} = require("./controllers/replyController");
const LeaderboardController = require('./controllers/leaderboardcontroller');
const queueController = require("./controllers/queuecontroller"); // Import the queue controller
const waitingRoomController = require("./controllers/waitingroomcontroller");
const allChatRequestController = require('./controllers/allchatrequestcontroller');
const signupController = require("./controllers/signupController");

const staticMiddleware = express.static("public");

// Set up storage for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');  // Store files in the 'public/uploads/' folder
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));  // Use current timestamp as filename
    }
});

const upload = multer({ storage: storage });
app.use(express.static('public'));  // Ensure public directory is accessible

// Route for uploading files
app.post('/upload', upload.single('file'), (req, res) => {
    if (req.file) {
        res.status(200).json({
            message: 'File uploaded successfully!',
            fileUrl: `/uploads/${req.file.filename}` // Return the file URL
        });
    } else {
        res.status(400).json({ message: 'No file uploaded.' });
    }
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(staticMiddleware);
app.use(express.json());
app.use(express.static(path.join(__dirname+"/public")));

activeUsers = 0

io.on("connection", function (socket) {
    console.log("A user connected");

    // When a new user tries to join
    socket.on("newuser", function(username){
        if (activeUsers >= 2) {
            socket.emit("chatfull");  // Notify the user that the chat is full
        } else {
            activeUsers++;
            socket.broadcast.emit("update", username + " joined the conversation");
        }
    });

    // Handle incoming chat messages
    socket.on("chat", function (message) {
        socket.broadcast.emit("chat", message); // Broadcast the message to other users
    });

    // When a user exits the chat
    socket.on("exituser", function (username) {
        activeUsers--;  // Decrease the active user count

        // Make an HTTP request to delete the user's chat request
        axios.delete(`http://localhost:3000/waitingroom/delete_chat_request?username=${username}`)
            .then(response => {
                console.log(`Chat request for user ${username} deleted successfully.`);
            })
            .catch(error => {
                console.error(`Error deleting chat request for user ${username}:`, error);
            });

        socket.broadcast.emit("update", username + " left the conversation");
    });

    // Handle user disconnection
    socket.on("disconnect", function () {
        activeUsers--;  // Decrease the active user count
        console.log("A user disconnected");
    });
});

// Add this line to use the waiting room controller
app.use('/waitingroom', waitingRoomController);

// Add the route for fetching all chat requests
app.get('/admin/chatrequests', allChatRequestController.fetchAllChatRequests);
app.put('/admin/chatrequests/:id/accept', allChatRequestController.acceptChatRequest);

// handle chat request form submissions
app.post("/submit_chat_request", queueController.submitChatRequest);

// User login route
app.post("/users/login", userController.login);

// Get reputation for each user
app.get("/users/:username/reputation", userController.getUserReputation);

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
app.delete("/replies/:reply_id", deleteReply);
app.post("/replies/:reply_id/likes", likeReply);

// get username and reputation for leaderboard
app.get('/leaderboard', LeaderboardController.getLeaderboard);

// Admin-only routes
app.get('/admin/threads', isAdmin, async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request().query("SELECT * FROM Threads");
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error("Error fetching threads for admin:", error);
        res.status(500).json({ message: "Error retrieving threads" });
    }
});

// Delete a thread
app.delete('/admin/threads/:thread_id', isAdmin, async (req, res) => {
    const { thread_id } = req.params;
    try {
        const pool = await sql.connect(dbConfig);

        // Delete reactions to all replies in the thread first
        await pool.request()
            .input("thread_id", sql.Int, thread_id)
            .query(`
                DELETE FROM ReplyReactions
                WHERE reply_id IN (SELECT reply_id FROM Replies WHERE thread_id = @thread_id)
            `);

        // Delete all replies for the thread (including nested ones)
        await pool.request()
            .input("thread_id", sql.Int, thread_id)
            .query(`
                DELETE FROM Replies
                WHERE thread_id = @thread_id OR parent_reply_id IN (SELECT reply_id FROM Replies WHERE thread_id = @thread_id)
            `);

        // Delete the thread
        await pool.request()
            .input("thread_id", sql.Int, thread_id)
            .query("DELETE FROM Threads WHERE thread_id = @thread_id");

        res.status(200).json({ message: "Thread deleted successfully by admin." });
    } catch (error) {
        console.error("Error deleting thread by admin:", error);
        res.status(500).json({ message: "Failed to delete thread." });
    }
});


// Delete a reply
app.delete('/admin/replies/:reply_id', isAdmin, async (req, res) => {
    const { reply_id } = req.params;
    try {
        const pool = await sql.connect(dbConfig);

        // Start a transaction to ensure atomic deletion of related data
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // Step 1: Delete reactions related to the reply
            await transaction.request()
                .input("reply_id", sql.Int, reply_id)
                .query(`
                    DELETE FROM ReplyReactions
                    WHERE reply_id = @reply_id
                `);

            // Step 2: Delete the actual reply
            await transaction.request()
                .input("reply_id", sql.Int, reply_id)
                .query(`
                    DELETE FROM Replies
                    WHERE reply_id = @reply_id
                `);

            // Step 3: Commit the transaction
            await transaction.commit();
            res.status(200).json({ message: "Reply and its reactions deleted successfully." });
        } catch (error) {
            // Rollback transaction if any error occurs
            await transaction.rollback();
            console.error("Error deleting reply:", error);
            res.status(500).json({ message: "Failed to delete reply due to a database error." });
        }
    } catch (error) {
        console.error("Error starting transaction:", error);
        res.status(500).json({ message: "Failed to start transaction." });
    }
});

app.post("/users/signup", signupController.signup);

server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
