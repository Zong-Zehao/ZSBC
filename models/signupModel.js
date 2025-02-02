// models/userModel.js
const sql = require("mssql");
const bcrypt = require("bcrypt");
const dbConfig = require("../dbConfig");

class User {
  constructor(id, username, password) {
    this.id = id;
    this.username = username;
    this.password = password;
  }

  static async getUserByUsername(username) {
    try {
      const connection = await sql.connect(dbConfig);

      const sqlQuery = "SELECT * FROM Users WHERE username = @Username";
      const request = connection.request();
      request.input("Username", sql.VarChar, username);
      const result = await request.query(sqlQuery);

      connection.close();

      if (result.recordset.length > 0) {
        const user = result.recordset[0];
        return new User(user.id, user.username, user.password);
      }

      return null;
    } catch (err) {
      console.error("Error getting user by username:", err);
      throw err;
    }
  }

  static async createUser(username, password) {
    try {
      const connection = await sql.connect(dbConfig);

      // Hash the password before storing it
      const hashedPassword = await bcrypt.hash(password, 10);

      const sqlQuery = `
        INSERT INTO Users (username, password)
        OUTPUT INSERTED.id, INSERTED.username, INSERTED.password
        VALUES (@Username, @Password)
      `;

      const request = connection.request();
      request.input("Username", sql.VarChar, username);
      request.input("Password", sql.VarChar, hashedPassword);
      const result = await request.query(sqlQuery);

      connection.close();

      if (result.recordset.length > 0) {
        const user = result.recordset[0];
        return new User(user.id, user.username, user.password);
      }

      return null;
    } catch (err) {
      console.error("Error creating user:", err);
      throw err;
    }
  }
}

module.exports = User;
