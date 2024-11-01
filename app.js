const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 3000;
const dbConfig = require("./dbConfig");
const sql = require("mssql");
const userController = require("./controllers/userController.js");
const staticMiddleware = express.static("public"); // Path to the public folder

// Include body-parser middleware to handle JSON data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // For form data handling

app.use(staticMiddleware); // Mount the static middleware

// login route
app.post("/users/login", userController.login);

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
