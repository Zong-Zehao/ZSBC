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
}

module.exports = User;
