-- Create Database
CREATE DATABASE FEDASG;
-- Create Users table
CREATE TABLE Users (
    username VARCHAR(255) PRIMARY KEY,
    password VARCHAR(255),    
    role VARCHAR(255),
    reputation INT DEFAULT 0
);

INSERT INTO Users (username, password, role, reputation)
VALUES ('johndoe', 'password123', 'admin', 100);

CREATE TABLE Threads ( 
    thread_id INT PRIMARY KEY IDENTITY(1,1),  -- Unique identifier for each thread 
    title VARCHAR(255) NOT NULL,               -- Title of the thread 
    content TEXT NOT NULL,                      -- Content of the thread 
    date DATE DEFAULT CURRENT_TIMESTAMP,      -- Date when the thread is created 
    username VARCHAR(255) NOT NULL,            -- Username of the user who created the thread 
    FOREIGN KEY (username) REFERENCES Users(username)  -- Reference to the Users table 
);

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
