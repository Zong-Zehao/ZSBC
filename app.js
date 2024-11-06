const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 3000;
const userController = require("./controllers/userController.js"); // Ensure this path is correct
const { createThread } = require('./controllers/threadController'); // Import thread controller
const staticMiddleware = express.static("public");
const { getThreads } = require('./controllers/shownewthreadcontroller'); // show all threads


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(staticMiddleware);

console.log("userController.login:", userController.login); // Debugging check

app.post("/users/login", userController.login);
app.post('/threads', createThread);
app.get('/threads', getThreads); // to display threads at main page html :)


app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
