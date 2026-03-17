const mysql = require('mysql2/promise');

async function connectDB() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'dt2711',
    database: 'shopaiweb'
  });

  console.log("Connected to MySQL");
}

connectDB();