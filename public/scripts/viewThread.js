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

// Flags for tracking like/dislike actions
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
    .then(([thread, replies]) => {
        // Update post object with thread details
        post = {
            author: thread.username,
            title: thread.title,
            content: thread.content,
            date: new Date(thread.date).toLocaleDateString(),
            likes: thread.likes || 0,
            dislikes: thread.dislikes || 0,
            repliesCount: replies.length,
            replies: replies
        };

        // Render post and replies
        renderPost();
        renderAllReplies(replies);
    })
    .catch(error => {
        console.error('Error loading thread or replies:', error);
        document.getElementById("post-container").innerHTML = "<p>Error loading thread.</p>";
    });
}

// Render the main post
function renderPost() {
    const postContainer = document.getElementById("post-container");
    postContainer.innerHTML = `
        <div class="post">
            <h3>${post.author}</h3>
            <h2>${post.title}</h2>
            <p>${post.content}</p>
            <small>${post.date}</small>
            <div class="interaction">
                <span><i class='bx bx-like' id="like-btn"></i> <span id="post-likes">${post.likes}</span></span>
                <span><i class='bx bx-dislike' id="dislike-btn"></i> <span id="post-dislikes">${post.dislikes}</span></span>
                <span><i class='bx bx-chat'></i> <span id="post-replies">${post.repliesCount}</span></span>
            </div>
            <button class="reply-btn" onclick="addReplyToPost()">Reply</button>
        </div>
    `;

    document.getElementById("like-btn").addEventListener("click", () => handleLikeDislike("like"));
    document.getElementById("dislike-btn").addEventListener("click", () => handleLikeDislike("dislike"));
}

// Function to handle like or dislike for the main post
function handleLikeDislike(action) {
    if (action === "like" && !hasLikedPost) {
        post.likes++;
        hasLikedPost = true;
        if (hasDislikedPost) {
            post.dislikes--;
            hasDislikedPost = false;
        }
    } else if (action === "dislike" && !hasDislikedPost) {
        post.dislikes++;
        hasDislikedPost = true;
        if (hasLikedPost) {
            post.likes--;
            hasLikedPost = false;
        }
    }
    document.getElementById("post-likes").innerText = post.likes;
    document.getElementById("post-dislikes").innerText = post.dislikes;
}

// Function to render all replies recursively
function renderAllReplies(replies, container = document.getElementById("reply-container"), parentId = null) {
    container.innerHTML = ""; // Clear the container to avoid duplication

    const filteredReplies = replies.filter(reply => reply.parent_reply_id === parentId);

    filteredReplies.forEach(reply => {
        const replyElement = document.createElement("div");
        replyElement.classList.add(parentId ? "nested-reply" : "reply");
        replyElement.innerHTML = `
            <h4>${reply.author}</h4>
            <p>${reply.content}</p>
            <small>${new Date(reply.date).toLocaleDateString()}</small>
            <div class="interaction">
                <span><i class='bx bx-like' id="like-reply-${reply.reply_id}"></i> <span id="reply-likes-${reply.reply_id}">${reply.likes || 0}</span></span>
                <span><i class='bx bx-dislike' id="dislike-reply-${reply.reply_id}"></i> <span id="reply-dislikes-${reply.reply_id}">${reply.dislikes || 0}</span></span>
                <button class="reply-btn" onclick="addReplyToReply(${reply.reply_id}, this)">Reply</button>
            </div>
        `;

        // Create a container for nested replies
        const nestedContainer = document.createElement("div");
        nestedContainer.classList.add("nested-reply-container");
        replyElement.appendChild(nestedContainer);

        container.appendChild(replyElement);

        // Recursively render nested replies
        renderAllReplies(replies, nestedContainer, reply.reply_id);
    });
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
    .then((newReply) => {
        if (!newReply || !newReply.reply_id) {
            console.error("Failed to get the full reply data");
            return;
        }
        loadThreadDetailsAndReplies(); // Refresh replies to ensure correct styling
    })
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
    .then((newReply) => {
        if (!newReply || !newReply.reply_id) {
            console.error("Failed to get the full reply data");
            return;
        }
        loadThreadDetailsAndReplies(); // Refresh replies to ensure correct styling
    })
    .catch(error => console.error('Error adding nested reply:', error));
}

// Load the thread details and replies when the page loads
window.onload = loadThreadDetailsAndReplies;
