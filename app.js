const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 3000;
const userController = require("./controllers/userController.js"); 
const { createThread } = require('./controllers/threadController'); 
const { getThreads, getThreadById } = require('./controllers/shownewthreadcontroller'); 
const staticMiddleware = express.static("public");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(staticMiddleware);

console.log("userController.login:", userController.login);

app.post("/users/login", userController.login);
app.post('/threads', createThread);
app.get('/threads', getThreads); 
app.get('/threads/:thread_id', getThreadById); // Use getThreadById directly

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
