const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = 3000;
const userController = require("./controllers/userController.js"); // Ensure this path is correct
const staticMiddleware = express.static("public");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(staticMiddleware);

console.log("userController.login:", userController.login); // Debugging check

app.post("/users/login", userController.login);

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
