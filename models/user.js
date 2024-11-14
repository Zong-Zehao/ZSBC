const sql = require("mssql");
const dbConfig = require("../dbConfig");

class User {
  static async retrieveUser(username) {
    try {
      const pool = await sql.connect(dbConfig);
      const result = await pool
        .request()
        .input("username", sql.VarChar, username)
        .query("SELECT * FROM Users WHERE username = @username");

      return result.recordset[0];
    } catch (error) {
      console.error("Error retrieving user:", error);
      return null;
    }
  }

// get user with reputation
  static async getUserWithReputation(username) {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input("username", sql.VarChar, username)
            .query("SELECT username, reputation FROM Users WHERE username = @username");
        
        return result.recordset[0]; // Return user data with reputation
    } catch (error) {
        console.error("Error fetching user reputation:", error);
        throw error;
    }
  }
}

module.exports = User;
