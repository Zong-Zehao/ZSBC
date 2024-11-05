-- Create Database
CREATE DATABASE FEDASG;
-- Create Users table
CREATE TABLE Users (
    username PRIMARY KEY,
    password VARCHAR(255),    
    role VARCHAR(255),
    reputation INT DEFAULT 0
);


INSERT INTO Users (username, password, role, reputation) VALUES 
('john_doe', 'password123', 'admin', 100),
('jane_smith', 'password456', 'user', 50),
('adminnew', '123', 'admin', 100)