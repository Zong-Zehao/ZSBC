--DROP TABLES   
DROP TABLE Replies;
DROP TABLE Threads;
DROP TABLE Users;
DROP TABLE ReplyReactions;

-- Create Users table
CREATE TABLE Users (
    username VARCHAR(255) PRIMARY KEY,
    password VARCHAR(255),    
    role VARCHAR(255),
    reputation INT DEFAULT 0
);

-- Insert users
INSERT INTO Users (username, password, role, reputation)
VALUES 
('johndoe', 'password123', 'admin', 100),
('alice', 'alicepass', 'user', 50),
('z', 'z', 'user', 20),
('janedoe', 'password456', 'user', 30),
('charlie', 'charliepass', 'user', 40);

CREATE TABLE Threads ( 
    thread_id INT PRIMARY KEY IDENTITY(1,1),  -- Unique identifier for each thread 
    title VARCHAR(255) NOT NULL,               -- Title of the thread
    category VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,                      -- Content of the thread 
    date DATE DEFAULT CURRENT_TIMESTAMP,      -- Date when the thread is created 
    username VARCHAR(255) NOT NULL,            -- Username of the user who created the thread 
    total_likes INT DEFAULT 0,
    total_dislikes INT DEFAULT 0,
    likes TEXT,
    dislikes TEXT,
    FOREIGN KEY (username) REFERENCES Users(username)  -- Reference to the Users table 
);

INSERT INTO Threads (title, category, content, date, username, total_likes, total_dislikes, likes, dislikes)
VALUES 
('Welcome to the forum', 'Introduction', 'This is an introduction post.', '2024-01-10', 'johndoe', 3, 0, '["alice", "z", "charlie"]', '[]'),
('General Discussion', 'General', 'Lets talk about general topics here.', '2024-02-15', 'alice', 2, 1, '["johndoe", "janedoe"]', '["z"]'),
('Help Needed', 'Support', 'I need help with my account.', '2024-03-20', 'z', 1, 0, '["alice"]', '[]'),
('Forum Rules', 'Rules', 'Please read the forum rules before posting.', '2024-04-05', 'janedoe', 4, 0, '["alice", "z", "charlie", "johndoe"]', '[]'),
('Tech Talk', 'Technology', 'Discuss the latest in technology!', '2024-05-10', 'charlie', 3, 1, '["johndoe", "alice", "z"]', '["janedoe"]');

-- Create Replies table
CREATE TABLE Replies (
    reply_id INT PRIMARY KEY IDENTITY(1,1),       -- Unique identifier for each reply
    thread_id INT NOT NULL,                       -- ID of the thread this reply is associated with
    author VARCHAR(255) NOT NULL,                 -- Username of the reply author
    content TEXT NOT NULL,                        -- Content of the reply
    date DATETIME DEFAULT CURRENT_TIMESTAMP,      -- Date and time of the reply
    FOREIGN KEY (thread_id) REFERENCES Threads(thread_id),  -- Reference to Threads table
    FOREIGN KEY (author) REFERENCES Users(username)         -- Reference to Users table
);
ALTER TABLE Replies
ADD parent_reply_id INT NULL;

-- Update the foreign key constraint to reference Replies table for nested replies
ALTER TABLE Replies
ADD CONSTRAINT FK_Replies_ParentReply
FOREIGN KEY (parent_reply_id) REFERENCES Replies(reply_id);
ALTER TABLE Replies ADD likes INT DEFAULT 0, dislikes INT DEFAULT 0;

-- Create ReplyReactions table to track likes and dislikes for each user on each reply
CREATE TABLE ReplyReactions (
    reaction_id INT PRIMARY KEY IDENTITY(1,1),
    reply_id INT NOT NULL,
    username VARCHAR(255) NOT NULL,
    reaction_type VARCHAR(10) CHECK (reaction_type IN ('like', 'dislike')),
    reacted_to VARCHAR(255) NOT NULL,
    FOREIGN KEY (reply_id) REFERENCES Replies(reply_id),
    FOREIGN KEY (username) REFERENCES Users(username),
    FOREIGN KEY (reacted_to) REFERENCES Users(username)
);

-- Ensure each user can only have one reaction per reply
CREATE UNIQUE INDEX idx_user_reply_reaction ON ReplyReactions (reply_id, username);