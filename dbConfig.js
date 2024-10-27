module.exports = {
    user: "ZSBCADMIN", // Replace with your SQL Server login username
    password: "123", // Replace with your SQL Server login password
    server: "localhost",
    database: "FEDASG",
    trustServerCertificate: true,
    options: {
      port: 1433, // Default SQL Server port
      connectionTimeout: 60000, // Connection timeout in milliseconds
    },
  };
  
  