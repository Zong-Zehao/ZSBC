// Helper function to get the thread ID from the URL parameters
function getThreadIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("thread_id");
}

// Global variable to store the thread and replies data
let post = {
    author: "",
    title: "",
    content: "",
    date: "",
    likes: 0,
    dislikes: 0,
    repliesCount: 0,
    replies: []
};

// Variables to track if the user has liked or disliked the post
let hasLikedPost = false;
let hasDislikedPost = false;

// Function to load thread details and replies
function loadThreadDetailsAndReplies() {
    const thread_id = getThreadIdFromURL();

    if (!thread_id) {
        document.getElementById("post-container").innerHTML = "<p>Thread not found.</p>";
        return;
    }

    // Fetch thread details and replies
    Promise.all([
        fetch(`/threads/${thread_id}`).then(response => response.json()), // Get thread details
        fetch(`/threads/${thread_id}/replies`).then(response => response.json()) // Get replies
    ])
        .then(([thread, replyData]) => {
            const { replies, totalLikes, totalDislikes, userReaction } = replyData;

            // Update post object with thread details and total likes/dislikes
            post = {
                author: thread.username,
                title: thread.title,
                content: thread.content,
                date: new Date(thread.date).toLocaleDateString(),
                likes: totalLikes,
                dislikes: totalDislikes,
                repliesCount: replies.length,
                replies: replies
            };

            // Update like/dislike state based on user reaction
            hasLikedPost = userReaction === "like";
            hasDislikedPost = userReaction === "dislike";

            // Render post and replies
            renderPost();
            renderAllReplies(replies);
        })
        .catch(error => {
            console.error("Error loading thread or replies:", error);
            document.getElementById("post-container").innerHTML = "<p>Error loading thread.</p>";
        });
}

// Render the main post
function renderPost() {
    const postContainer = document.getElementById("post-container");
    const username = localStorage.getItem("username");
    const role = localStorage.getItem("role"); // Retrieve the user's role
    const isAuthor = username === post.author;
    const isAdmin = role === "admin";

    console.log(`Current User: ${username}, Role: ${role}, Is Admin: ${isAdmin}, Post Author: ${post.author}`);

    postContainer.innerHTML = `
        <div class="post">
            <h3>${post.author}</h3>
            <h2>${post.title}</h2>
            <p>${post.content}</p>
            <small>${post.date}</small>
            <div class="interaction">
                <span>
                    <i class='bx bx-like ${hasLikedPost ? "active" : ""}' onclick="handleLikeDislikeThread('like')"></i> ${post.likes}
                </span>
                <span>
                    <i class='bx bx-dislike ${hasDislikedPost ? "active" : ""}' onclick="handleLikeDislikeThread('dislike')"></i> ${post.dislikes}
                </span>
                <span><i class='bx bx-chat'></i> ${post.repliesCount}</span>
            </div>
            <button class="reply-btn" onclick="addReplyToPost()">Reply</button>
            ${
                isAuthor || isAdmin
                    ? `<div class="menu">
                           <button class="menu-btn" onclick="toggleMenu(this)">...</button>
                           <div class="menu-options" style="display:none;">
                               <button onclick="deleteThread()">Delete Thread</button>
                           </div>
                       </div>`
                    : ""
            }
        </div>
    `;
}

// Function to handle like or dislike for the main post
function handleLikeDislikeThread(action) {
    const thread_id = getThreadIdFromURL();
    const username = localStorage.getItem("username");

    if (!thread_id) {
        console.error("Thread ID is missing");
        return;
    }

    // Prevent multiple likes/dislikes
    if (action === "like" && hasLikedPost) return;
    if (action === "dislike" && hasDislikedPost) return;

    // Toggle like/dislike status
    if (action === "like") {
        hasLikedPost = true;
        hasDislikedPost = false;
    } else if (action === "dislike") {
        hasDislikedPost = true;
        hasLikedPost = false;
    }

    fetch(`/threads/${thread_id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }) // Include username in the request
    })
        .then(response => response.json())
        .then(data => {
            if (data.message === "Thread liked successfully." || data.message === "Thread disliked successfully.") {
                loadThreadDetailsAndReplies(); // Refresh thread details after action
            } else {
                console.error(data.message);
            }
        })
        .catch(error => console.error(`Error ${action} thread:`, error));
}

function renderAllReplies(replies, container = document.getElementById("reply-container"), parentId = null) {
    container.innerHTML = "";

    const filteredReplies = replies.filter(reply => reply.parent_reply_id === parentId);

    filteredReplies.forEach(reply => {
        const username = localStorage.getItem("username");
        const role = localStorage.getItem("role");
        const isAuthor = username === reply.author;
        const isAdmin = role === "admin";

        const replyElement = document.createElement("div");
        replyElement.classList.add(parentId ? "nested-reply" : "reply");
        replyElement.innerHTML = `
            <h4>${reply.author}</h4>
            <p>${reply.content}</p>
            <small>${new Date(reply.date).toLocaleDateString()}</small>
            <div class="interaction">
                <span><i class='bx bx-like'></i> ${reply.likes || 0}</span>
                <span><i class='bx bx-dislike'></i> ${reply.dislikes || 0}</span>
                <button class="reply-btn" onclick="addReplyToReply(${reply.reply_id}, this)">Reply</button>
            </div>
            ${
                isAuthor || isAdmin
                    ? `<div class="menu">
                           <button class="menu-btn" onclick="toggleMenu(this)">...</button>
                           <div class="menu-options" style="display:none;">
                               <button onclick="deleteReply(${reply.reply_id})">Delete Reply</button>
                           </div>
                       </div>`
                    : ""
            }
        `;
        const nestedContainer = document.createElement("div");
        nestedContainer.classList.add("nested-reply-container");
        replyElement.appendChild(nestedContainer);
        container.appendChild(replyElement);
        renderAllReplies(replies, nestedContainer, reply.reply_id);
    });
}
// Function to toggle the visibility of the menu 
function toggleMenu(button) { 
    const menu = button.nextElementSibling; 
    menu.style.display = menu.style.display === "none" ? "block" : "none"; 
} 
 
// Function to delete a thread 
function deleteThread() {
    const thread_id = getThreadIdFromURL();
    const username = localStorage.getItem("username");

    if (confirm("Are you sure you want to delete this thread?")) {
        fetch(`/threads/${thread_id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === "Thread deleted successfully") {
                console.log("Thread deleted:", thread_id);
                alert("Thread deleted successfully! Redirecting to main page...");
                window.location.href = "mainpage.html"; // Redirect after deletion
            } else {
                console.error("Delete failed:", data.message);
                alert(data.message);
            }
        })
        .catch(error => {
            console.error("Error deleting thread:", error);
            alert("An error occurred while deleting the thread.");
        });
    }
}
// Function to delete a reply 
function deleteReply(reply_id) { 
    const username = localStorage.getItem("username"); 
 
    if (confirm("Are you sure you want to delete this reply?")) { 
        fetch(`/replies/${reply_id}`, { 
            method: 'DELETE', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ username }) 
        }) 
            .then(response => response.json()) 
            .then(() => loadThreadDetailsAndReplies()) // Refresh replies 
            .catch(error => console.error("Error deleting reply:", error)); 
    } 
} 
// Function to add a reply to the main post 
function addReplyToPost() { 
    const replyContent = prompt("Enter your reply:"); 
    if (!replyContent) return; 
 
    const thread_id = getThreadIdFromURL(); 
    if (!thread_id) { 
        console.error("Thread ID is missing"); 
        return; 
    } 
 
    const author = localStorage.getItem("username") || "Guest"; 
 
    fetch(`/threads/${thread_id}/replies`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ thread_id, author, content: replyContent, parent_reply_id: null }) 
    }) 
    .then(response => response.json()) 
    .then(() => loadThreadDetailsAndReplies()) 
    .catch(error => console.error('Error adding reply:', error)); 
} 
 
// Function to add a reply to a reply 
function addReplyToReply(parent_reply_id, parentReplyElement) { 
    const replyContent = prompt("Enter your reply:"); 
    if (!replyContent) return; 
 
    const thread_id = getThreadIdFromURL(); 
    if (!thread_id) { 
        console.error("Thread ID is missing"); 
        return; 
    } 
 
    const author = localStorage.getItem("username") || "Guest"; 
 
    fetch(`/threads/${thread_id}/replies`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ thread_id, author, content: replyContent, parent_reply_id }) 
    }) 
    .then(response => response.json()) 
    .then(() => loadThreadDetailsAndReplies()) 
    .catch(error => console.error('Error adding nested reply:', error)); 
} 
// Load the thread details and replies when the page loads
window.onload = loadThreadDetailsAndReplies;
