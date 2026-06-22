const sql = require("mssql");
require("dotenv").config();

const config = {
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT) || 1433,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  options: {
    encrypt: false, // true nếu dùng Azure
    trustServerCertificate: true, // bỏ lỗi cert tự ký
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
  },
};

// Pool dùng chung cho toàn app
let pool;

async function getPool() {
  if (!pool) {
    pool = await sql.connect(config);
    console.log("✅ Kết nối SQL Server thành công");
  }
  return pool;
}

module.exports = { getPool, sql };
