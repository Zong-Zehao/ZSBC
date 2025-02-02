(function () {
    const app = document.querySelector(".app");
    const socket = io();

    let uname;

    // Handle joining the chat
    app.querySelector(".join-screen #join-user").addEventListener("click", function () {
        let username = app.querySelector(".join-screen #username").value;
        if (username.length == 0) {
            return;
        }
        socket.emit("newuser", username);
        uname = username;
        app.querySelector(".join-screen").classList.remove("active");
        app.querySelector(".chat-screen").classList.add("active");
    });

    // Handle sending a message (with or without file)
    app.querySelector(".chat-screen #send-message").addEventListener("click", function () {
        let message = app.querySelector(".chat-screen #message-input").value;
        let fileInput = app.querySelector(".chat-screen #file-input");
        let file = fileInput.files[0];

        // Send the text message
        if (message.length > 0) {
            renderMessage("my", {
                username: uname,
                text: message
            });
            socket.emit("chat", {
                username: uname,
                text: message
            });
        }

        // Send the file if one is selected
        if (file) {
            let formData = new FormData();
            formData.append('file', file);

            // Send the file to the server
            fetch('/upload', {
                method: 'POST',
                body: formData
            })
                .then(response => response.json())
                .then(data => {
                    if (data.fileUrl) {
                        renderMessage("my", {
                            username: uname,
                            text: `<a href="${data.fileUrl}" target="_blank">View file</a>`
                        });
                        socket.emit("chat", {
                            username: uname,
                            text: `<a href="${data.fileUrl}" target="_blank">View file</a>`
                        });
                    }
                })
                .catch(error => console.error('File upload error:', error));
        }

        // Clear input fields
        app.querySelector(".chat-screen #message-input").value = "";
        fileInput.value = ""; // Reset file input
    });

    // Handle user exit
    app.querySelector(".chat-screen #exit-chat").addEventListener("click", function () {
        socket.emit("exituser", uname);
        window.location.href = "mainpage.html";  // Redirect to mainpage.html
    });

    socket.on("update", function (update) {
        renderMessage("update", update);
    });

    socket.on("chat", function (message) {
        renderMessage("other", message);
    });

    socket.on("chatfull", function () {
        alert("The chat is full. You cannot join at the moment.");
    });

    function renderMessage(type, message) {
        let messageContainer = app.querySelector(".chat-screen .messages");
        if (type == "my") {
            let el = document.createElement("div");
            el.setAttribute("class", "message my-message");
            el.innerHTML = `
                <div>
                    <div class="name">You</div>
                    <div class="text">${message.text}</div>
                </div>
            `;
            messageContainer.appendChild(el);
        } else if (type == "other") {
            let el = document.createElement("div");
            el.setAttribute("class", "message other-message");
            el.innerHTML = `
                <div>
                    <div class="name">${message.username}</div>
                    <div class="text">${message.text}</div>
                </div>
            `;
            messageContainer.appendChild(el);
        } else if (type == "update") {
            let el = document.createElement("div");
            el.setAttribute("class", "update");
            el.innerText = message;
            messageContainer.appendChild(el);
        }
        // Scroll chat to end
        messageContainer.scrollTop = messageContainer.scrollHeight - messageContainer.clientHeight;
    }
})();
