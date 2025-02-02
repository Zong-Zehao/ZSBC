let allThreads = [];

// Fetch threads for admin
function loadThreadsForAdmin() {
    const username = localStorage.getItem("username");
    if (!username) {
        console.error("Username not found in localStorage.");
        alert("You must be logged in as an admin to access this page.");
        return;
    }

    fetch('/admin/threads', {
        headers: { username } // Pass username for admin validation
    })
    .then(response => {
        if (response.status === 403) {
            throw new Error("Access denied. You are not an admin.");
        }
        return response.json();
    })
    .then(threads => {
        allThreads = threads;
        displayThreads(threads);
    })
    .catch(error => console.error('Error loading threads for admin:', error));
}


function toggleReplies(thread_id, button) {
    const repliesContainer = document.getElementById(`replies-container-${thread_id}`);
    if (repliesContainer.style.display === "none") {
        loadRepliesForAdmin(thread_id, button);
        repliesContainer.style.display = "block";
        button.textContent = "Hide Replies";
    } else {
        repliesContainer.style.display = "none";
        button.textContent = "View Replies";
    }
}

// Delete a thread as an admin
function deleteThread(thread_id) {
    const username = localStorage.getItem("username");
    if (!username) {
        alert("You must be logged in to perform this action.");
        return;
    }

    if (confirm("Are you sure you want to delete this thread?")) {
        fetch(`/admin/threads/${thread_id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                username // Pass username for admin validation
            }
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            location.reload(); // Reload the page after thread is deleted
        })
        .catch(error => console.error('Error deleting thread:', error));
    }
}

// Fetch replies for a thread
function loadRepliesForAdmin(thread_id, button) {
    fetch(`/threads/${thread_id}/replies`)
        .then(response => response.json())
        .then(data => {
            const repliesContainer = document.getElementById(`replies-container-${thread_id}`);
            repliesContainer.innerHTML = ""; // Clear the container

            if (!data.replies || data.replies.length === 0) {
                repliesContainer.innerHTML = "<p>No replies for this thread.</p>";
                return;
            }

            data.replies.forEach(reply => {
                loadUserReputation(reply.author).then(reputation => {
                    const replyElement = document.createElement('div');
                    replyElement.classList.add('reply');
                    replyElement.innerHTML = `
                        <div class="name">${reply.author} (${reputation} rep)</div>
                        <div class="meta-container">
                            <div class="meta">Rep: ${reputation}</div>
                        </div>
                        <p>${reply.content}</p>
                        <div class="meta">
                            <span class="likes">
                                <i class="fas fa-thumbs-up"></i> ${reply.likes || 0}
                            </span>
                            <span class="dislikes">
                                <i class="fas fa-thumbs-down"></i> ${reply.dislikes || 0}
                            </span>
                        </div>
                        <div class="buttons">
                            <button class="delete-button" onclick="deleteReply(${reply.reply_id})">Delete Reply</button>
                        </div>
                        <small class="date">${new Date(reply.date).toLocaleDateString()}</small>
                    `;
                    repliesContainer.appendChild(replyElement);
                });
            });

            // Scroll to the replies section
            button.scrollIntoView({ behavior: 'smooth' });
        })
        .catch(error => console.error('Error loading replies for admin:', error));
}

// Function to load user reputation
function loadUserReputation(username) {
    return fetch(`/users/${username}/reputation`)
        .then(response => response.json())
        .then(data => data.reputation)
        .catch(error => {
            console.error('Error loading user reputation:', error);
            return 0; // Default reputation if there's an error
        });
}

// Admin delete reply function
function deleteReply(reply_id) {
    const username = localStorage.getItem("username");
    if (!username) {
        alert("You must be logged in to perform this action.");
        return;
    }

    if (confirm("Are you sure you want to delete this reply?")) {
        fetch(`/admin/replies/${reply_id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                username // Pass username for admin validation
            }
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            location.reload(); // Reload the page after reply is deleted
        })
        .catch(error => console.error('Error deleting reply:', error));
    }
}

// Utility function to get the current thread ID being viewed
function getCurrentThreadId() {
    const repliesContainer = document.getElementById('replies-container');
    const threadId = repliesContainer.getAttribute('data-thread-id');
    return threadId ? parseInt(threadId, 10) : null;
}




function displayThreads(threads) {
    const container = document.getElementById('threads-container');
    container.innerHTML = "";

    // Fetch reputation for all threads asynchronously
    const threadPromises = threads.map(thread => {
        return loadUserReputation(thread.username).then(reputation => {
            thread.reputation = reputation;  // Add reputation to each thread object
            return thread;
        });
    });

    // Wait until all reputations are fetched before displaying the threads
    Promise.all(threadPromises).then((threadsWithReputation) => {
        threadsWithReputation.forEach(thread => {
            const threadElement = document.createElement('div');
            threadElement.classList.add('thread');
            threadElement.innerHTML = `
                <div class="header">
                    <div class="name">${thread.username} (${thread.reputation} rep)</div>
                    <div class="meta-container">
                        <div class="category-label">${thread.category}</div>
                    </div>
                </div>
                <h2>${thread.title}</h2>
                <p>${thread.content}</p>
                <div class="meta">
                    <span class="likes">
                        <i class="fas fa-thumbs-up"></i> ${thread.total_likes}
                    </span>
                    <span class="dislikes">
                        <i class="fas fa-thumbs-down"></i> ${thread.total_dislikes || 0}
                    </span>
                </div>
                <div class="buttons">
                    <button onclick="toggleReplies(${thread.thread_id}, this)">View Replies </button>
                    <button class="delete-button" onclick="deleteThread(${thread.thread_id})">Delete Thread</button>
                </div>
                <small class="date">${new Date(thread.date).toLocaleDateString()}</small>
                <div class="replies-container" id="replies-container-${thread.thread_id}" style="display: none;"></div>
            `;
            container.appendChild(threadElement);
        });
    }).catch(error => console.error('Error loading reputations:', error));
}

function filterThreads(criteria) {
    let filteredThreads = [];

    if (criteria.toLowerCase() === 'newest') {
        filteredThreads = allThreads.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (criteria.toLowerCase() === 'best') {
        filteredThreads = allThreads.sort((a, b) => {
            const diffA = b.total_likes - b.total_dislikes;
            const diffB = a.total_likes - a.total_dislikes;
            if (diffA === diffB) {
                return b.total_likes - a.total_likes;
            }
            return diffA - diffB;
        });
    }

    // After reputation is added to all threads, call displayThreads
    displayThreads(filteredThreads);
}

// Make sure to load the threads and their reputations when the page loads
window.onload = () => {
    loadThreadsForAdmin();
};

