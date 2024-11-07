const sql = require('mssql');
const dbConfig = require('../dbConfig');

// Function to get all threads
async function getAllThreads() {
    try {
        // Connect to the database
        let pool = await sql.connect(dbConfig);
        
        // Execute the query to fetch all threads
        let result = await pool.request().query("SELECT * FROM Threads");

        // Return the result
        return result.recordset;
    } catch (error) {
        console.error("Error fetching threads:", error);
        throw error;
    }
}

module.exports = {
    getAllThreads
};