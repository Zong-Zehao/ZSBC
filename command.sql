-- Create Database
CREATE DATABASE FEDASG;
-- Create Users table
CREATE TABLE Users (
    username VARCHAR(255) PRIMARY KEY,
    password VARCHAR(255),    
    role VARCHAR(255),
    reputation INT DEFAULT 0
);

