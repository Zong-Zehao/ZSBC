// Fetch threads for admin

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
        const container = document.getElementById('threads-container');
        container.innerHTML = "";

        threads.forEach(thread => {
            const threadElement = document.createElement('div');
            threadElement.classList.add('thread');
            threadElement.innerHTML = `
                <div class="name">${thread.username}</div>
                <div class="meta">Category: ${thread.category} | Reputations: ${thread.total_likes}</div>
                <h2>${thread.title}</h2>
                <p>${thread.content}</p>
                <div class="buttons">
                    <button onclick="loadRepliesForAdmin(${thread.thread_id}, this)">View Replies</button>
                    <button class="delete-button" onclick="deleteThread(${thread.thread_id})">Delete Thread</button>
                </div>
                <small class="date">${new Date(thread.date).toLocaleDateString()}</small>
                <div class="replies-container" id="replies-container-${thread.thread_id}"></div>
            `;
            container.appendChild(threadElement);
        });
    })
    .catch(error => console.error('Error loading threads for admin:', error));
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
                const replyElement = document.createElement('div');
                replyElement.innerHTML = `
                    <p>${reply.content}</p>
                    <small>By: ${reply.author} on ${new Date(reply.date).toLocaleDateString()}</small>
                    <button onclick="deleteReply(${reply.reply_id})">Delete Reply</button>
                `;
                repliesContainer.appendChild(replyElement);
            });

            // Scroll to the replies section
            button.scrollIntoView({ behavior: 'smooth' });
        })
        .catch(error => console.error('Error loading replies for admin:', error));
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

// Load threads when the page loads
window.onload = () => {
    loadThreadsForAdmin();
};