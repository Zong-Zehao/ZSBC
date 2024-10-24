// Hardcoded post
let post = {
    author: "Jack",
    title: "What the sigma",
    content: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the.",
    date: "24/10/2024",
    likes: 0,  // Starting likes set to 0
    dislikes: 0,
    repliesCount: 0,
    replies: []
};

// To track like/dislike state for the post
let hasLikedPost = false;
let hasDislikedPost = false;

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

// Function to dynamically add replies to the post
function addReplyToPost() {
    const replyContent = prompt("Enter your reply:");
    if (replyContent) {
        post.repliesCount++;
        const newReply = {
            author: "You",
            content: replyContent,
            likes: 0,
            dislikes: 0,
            replies: []  // Nested replies
        };
        post.replies.push(newReply);
        const replyContainer = document.getElementById("reply-container");
        renderReply(newReply, replyContainer, post.replies.length - 1);  // Append new reply without clearing existing ones
        document.getElementById("post-replies").innerText = post.repliesCount;
    }
}

// Function to dynamically add replies to other replies
function addReplyToReply(element, index) {
    const replyContent = prompt("Enter your reply:");
    if (replyContent) {
        const parentDiv = element.parentElement.parentElement;
        const replyContainer = document.createElement("div");
        replyContainer.classList.add("reply");
        replyContainer.innerHTML = `
            <h4>You</h4>
            <p>${replyContent}</p>
            <div class="interaction">
                <span><i class='bx bx-like'></i> <span>0</span></span>
                <span><i class='bx bx-dislike'></i> <span>0</span></span>
                <button class="reply-btn" onclick="addReplyToReply(this)">Reply</button>
            </div>
        `;
        parentDiv.appendChild(replyContainer);  // Append reply to the parent reply without clearing others
    }
}

// Function to handle like or dislike for each reply
function handleReplyLikeDislike(index, action) {
    const reply = post.replies[index];

    // Ensure that the user can only like or dislike each reply once
    if (action === "like" && !reply.hasLiked) {
        reply.likes++;
        reply.hasLiked = true;
        if (reply.hasDisliked) {
            reply.dislikes--;
            reply.hasDisliked = false;
        }
    } else if (action === "dislike" && !reply.hasDisliked) {
        reply.dislikes++;
        reply.hasDisliked = true;
        if (reply.hasLiked) {
            reply.likes--;
            reply.hasLiked = false;
        }
    }

    // Update the like/dislike counts on the reply
    document.getElementById(`reply-likes-${index}`).innerText = reply.likes;
    document.getElementById(`reply-dislikes-${index}`).innerText = reply.dislikes;
}

// On page load, render the post and all replies
window.onload = function() {
    renderPost();
    renderAllReplies();
}
