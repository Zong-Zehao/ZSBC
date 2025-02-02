// Fetch user details and threads
function loadUserDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get("username");
    
    if (!username) {
        document.getElementById("user-details").innerHTML = "<p>User not found.</p>";
        return;
    }
    
    // Fetch user details
    fetch(`/users/${username}`)
        .then(response => response.json())
        .then(user => {
            document.getElementById("user-details").innerHTML = `
                <h3>${user.username}</h3>
                <p>Role: ${user.role}</p>
                <p>Reputation: ${user.reputation}</p>
            `;
        })
        .catch(error => {
            console.error("Error fetching user details:", error);
            document.getElementById("user-details").innerHTML = "<p>Error loading user details.</p>";
        });
    
    // Fetch user threads (using title, category, content, and date)
    fetch(`/users/${username}/threads`)
        .then(response => response.json())
        .then(threads => {
            const threadList = document.getElementById("threads-list");
            threadList.innerHTML = "";
            
            if (threads.length === 0) {
                threadList.innerHTML = "<p>No threads created.</p>";
                return;
            }
            
            threads.forEach(thread => {
                const threadItem = document.createElement("div");
                threadItem.classList.add("thread-item");

                // Format the date to a readable format
                const formattedDate = new Date(thread.date).toLocaleDateString();

                threadItem.innerHTML = `
                    <h4><a href="viewthread.html?thread_id=${thread.thread_id}">${thread.title}</a></h4>
                    <p><strong>Category:</strong> ${thread.category}</p>
                    <p><strong>Content:</strong> ${thread.content}</p>
                    <p><strong>Created on:</strong> ${formattedDate}</p>
                `;
                threadList.appendChild(threadItem);
            });
        })
        .catch(error => {
            console.error("Error fetching user threads:", error);
            document.getElementById("threads-list").innerHTML = "<p>Error loading threads.</p>";
        });
}

// Load user details on page load
window.onload = loadUserDetails;
