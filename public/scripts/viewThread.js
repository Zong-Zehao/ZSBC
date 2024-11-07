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
        renderAllReplies();
    })
    .catch(error => {
        console.error('Error loading thread or replies:', error);
        document.getElementById("post-container").innerHTML = "<p>Error loading thread.</p>";
    });
}

// Function to render the main post
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

// Function to render all replies
function renderAllReplies() {
    const replyContainer = document.getElementById("reply-container");
    replyContainer.innerHTML = ""; // Clear existing replies
    post.replies.forEach((reply, index) => renderReply(reply, replyContainer, index));
}

// Function to render a single reply
function renderReply(reply, container, index) {
    const replyElement = document.createElement("div");
    replyElement.classList.add("reply");
    replyElement.innerHTML = `
        <h4>${reply.author}</h4>
        <p>${reply.content}</p>
        <small>${new Date(reply.date).toLocaleDateString()}</small>
        <div class="interaction">
            <span><i class='bx bx-like' id="like-reply-${index}"></i> <span id="reply-likes-${index}">${reply.likes || 0}</span></span>
            <span><i class='bx bx-dislike' id="dislike-reply-${index}"></i> <span id="reply-dislikes-${index}">${reply.dislikes || 0}</span></span>
            <button class="reply-btn" onclick="addReplyToReply(${reply.reply_id})">Reply</button>
        </div>
    `;
    container.appendChild(replyElement);

    // Add event listeners for like/dislike on each reply
    document.getElementById(`like-reply-${index}`).addEventListener("click", () => handleReplyLikeDislike(index, "like"));
    document.getElementById(`dislike-reply-${index}`).addEventListener("click", () => handleReplyLikeDislike(index, "dislike"));
}

// Function to add a reply to the main post
function addReplyToPost() {
    const replyContent = prompt("Enter your reply:");
    if (!replyContent) return;

    const thread_id = getThreadIdFromURL();
    const author = localStorage.getItem("username") || "Guest";

    fetch(`/threads/${thread_id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author, content: replyContent })
    })
    .then(response => response.json())
    .then(() => loadThreadDetailsAndReplies())  // Refresh replies after adding
    .catch(error => console.error('Error adding reply:', error));
}

// Function to handle like or dislike for each reply
function handleReplyLikeDislike(index, action) {
    const reply = post.replies[index];
    if (action === "like" && !reply.hasLiked) {
        reply.likes = (reply.likes || 0) + 1;
        reply.hasLiked = true;
        if (reply.hasDisliked) {
            reply.dislikes = (reply.dislikes || 0) - 1;
            reply.hasDisliked = false;
        }
    } else if (action === "dislike" && !reply.hasDisliked) {
        reply.dislikes = (reply.dislikes || 0) + 1;
        reply.hasDisliked = true;
        if (reply.hasLiked) {
            reply.likes = (reply.likes || 0) - 1;
            reply.hasLiked = false;
        }
    }
    document.getElementById(`reply-likes-${index}`).innerText = reply.likes;
    document.getElementById(`reply-dislikes-${index}`).innerText = reply.dislikes;
}

// Load the thread details and replies when the page loads
window.onload = loadThreadDetailsAndReplies;
