// Function to get the thread ID from the URL parameters
function getThreadIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("thread_id");
}

// Global variable to store post data
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

// To track like/dislike state for the post
let hasLikedPost = false;
let hasDislikedPost = false;

// Function to load thread details based on thread_id
function loadThreadDetails() {
    const thread_id = getThreadIdFromURL();

    if (!thread_id) {
        document.getElementById("post-container").innerHTML = "<p>Thread not found.</p>";
        return;
    }

    // Fetch the thread details from the server using thread_id
    fetch(`/threads/${thread_id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(response => response.json())
    .then(thread => {
        if (!thread) {
            document.getElementById("post-container").innerHTML = "<p>Thread not found.</p>";
            return;
        }

        // Update the post object with the fetched data
        post.author = thread.username;
        post.title = thread.title;
        post.content = thread.content;
        post.date = new Date(thread.date).toLocaleDateString();
        post.likes = thread.likes || 0; // Assuming likes are stored in the database
        post.dislikes = thread.dislikes || 0;
        post.repliesCount = thread.repliesCount || 0;
        post.replies = thread.replies || [];

        // Render the post and replies using the updated post object
        renderPost();
        renderAllReplies();
    })
    .catch(error => {
        console.error('Error fetching thread details:', error);
        document.getElementById("post-container").innerHTML = "<p>Error loading thread.</p>";
    });
}

// Function to render the post
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

// The rest of the functions stay the same...

// Function to handle like or dislike for the post
function handleLikeDislike(action) {
    if (action === "like" && !hasLikedPost) {
        post.likes++;
        hasLikedPost = true;  // Ensure the user can only like once
        if (hasDislikedPost) {
            post.dislikes--;   // Remove dislike if the user switches from dislike to like
            hasDislikedPost = false;
        }
        document.getElementById("post-likes").innerText = post.likes;
        document.getElementById("post-dislikes").innerText = post.dislikes;
    } else if (action === "dislike" && !hasDislikedPost) {
        post.dislikes++;
        hasDislikedPost = true;  // Ensure the user can only dislike once
        if (hasLikedPost) {
            post.likes--;  // Remove like if the user switches from like to dislike
            hasLikedPost = false;
        }
        document.getElementById("post-likes").innerText = post.likes;
        document.getElementById("post-dislikes").innerText = post.dislikes;
    }
}

// Function to render all replies dynamically (called only once initially)
function renderAllReplies() {
    const replyContainer = document.getElementById("reply-container");
    replyContainer.innerHTML = "";  // Clear the container to avoid duplication
    post.replies.forEach((reply, index) => renderReply(reply, replyContainer, index));
}

// Function to render a single reply
function renderReply(reply, container, index) {
    const replyElement = document.createElement("div");
    replyElement.classList.add("reply");
    replyElement.innerHTML = `
        <h4>${reply.author}</h4>
        <p>${reply.content}</p>
        <div class="interaction">
            <span><i class='bx bx-like' id="like-reply-${index}"></i> <span id="reply-likes-${index}">${reply.likes}</span></span>
            <span><i class='bx bx-dislike' id="dislike-reply-${index}"></i> <span id="reply-dislikes-${index}">${reply.dislikes}</span></span>
            <button class="reply-btn" onclick="addReplyToReply(this, ${index})">Reply</button>
        </div>
    `;
    container.appendChild(replyElement);

    // Add event listeners for like/dislike for each reply
    document.getElementById(`like-reply-${index}`).addEventListener("click", () => handleReplyLikeDislike(index, "like"));
    document.getElementById(`dislike-reply-${index}`).addEventListener("click", () => handleReplyLikeDislike(index, "dislike"));
}

// On page load, load the thread details and render them
window.onload = loadThreadDetails;
