// Fetch threads for admin
function loadThreadsForAdmin() {
    fetch('/admin/threads', {
        headers: {
            username: localStorage.getItem("username") // Pass username for admin validation
        }
    })
        .then(response => response.json())
        .then(threads => {
            const container = document.getElementById('threads-container');
            container.innerHTML = ""; // Clear the container
    
            if (!Array.isArray(threads)) {
                console.error("Invalid data received for threads:", threads);
                return;
            }
    
            threads.forEach(thread => {
                const threadElement = document.createElement('div');
                threadElement.innerHTML = `
                    <h2>${thread.title}</h2>
                    <p>${thread.content}</p>
                    <small>Posted by: ${thread.username} on ${new Date(thread.date).toLocaleDateString()}</small>
                    <button onclick="deleteThread(${thread.thread_id})">Delete Thread</button>
                    <button onclick="loadRepliesForAdmin(${thread.thread_id})">View Replies</button>
                `;
                container.appendChild(threadElement);
            });
        })
        .catch(error => console.error('Error loading threads for admin:', error));
}

// Delete a thread as an admin
function deleteThread(thread_id) {
    if (confirm("Are you sure you want to delete this thread?")) {
        fetch(`/admin/threads/${thread_id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            loadThreadsForAdmin(); // Reload threads after deletion
        })
        .catch(error => console.error('Error deleting thread:', error));
    }
}

// Fetch replies for a thread
function loadRepliesForAdmin(thread_id) {
    fetch(`/threads/${thread_id}/replies`)
        .then(response => response.json())
        .then(data => {
            const repliesContainer = document.getElementById('replies-container');
            repliesContainer.innerHTML = ""; // Clear the container

            if (data.replies.length === 0) {
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
        })
        .catch(error => console.error('Error loading replies for admin:', error));
}

// Admin delete reply function
function deleteReply(reply_id) {
    if (confirm("Are you sure you want to delete this reply?")) {
        fetch(`/admin/replies/${reply_id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            // Reload replies for the current thread
            const currentThreadId = getCurrentThreadId();
            if (currentThreadId) {
                loadRepliesForAdmin(currentThreadId);
            }
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

    // Ensure the replies container has a thread ID attribute
    const repliesContainer = document.getElementById('replies-container');
    if (repliesContainer) {
        repliesContainer.setAttribute('data-thread-id', ''); // Initialize with empty thread ID
    }
};
