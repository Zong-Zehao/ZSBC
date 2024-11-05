const sql = require('mssql');
const dbConfig = require('../dbConfig');

async function createThread(title, content, username) {
    try {
        // Connect to the database
        await sql.connect(dbConfig);
        
        // Insert the new thread into the database
        await sql.query`INSERT INTO Threads (title, content, username) VALUES (${title}, ${content}, ${username})`;

        return { success: true, message: 'Thread created successfully!' };
    } catch (err) {
        console.error('Database error:', err);
        return { success: false, message: 'Error creating thread' };
    }
}

module.exports = {
    createThread,
};
