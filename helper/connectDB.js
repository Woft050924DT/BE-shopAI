require("./loadEnv");

const mysql = require("mysql2/promise");

function buildConfig() {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    const parsedUrl = new URL(databaseUrl);

    return {
      host: parsedUrl.hostname,
      port: parsedUrl.port ? Number(parsedUrl.port) : 3306,
      user: decodeURIComponent(parsedUrl.username),
      password: decodeURIComponent(parsedUrl.password),
      database: parsedUrl.pathname.replace(/^\//, ""),
    };
  }

  return {
    host: process.env.DATABASE_HOST || "localhost",
    user: process.env.DATABASE_USER || "root",
    password: process.env.DATABASE_PASSWORD || "",
    database: process.env.DATABASE_NAME || "shopaiweb",
  };
}

const pool = mysql.createPool({
  ...buildConfig(),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    connection.release();
    return true;
  } catch (_error) {
    return false;
  }
}

module.exports = {
  pool,
  testConnection,
};
