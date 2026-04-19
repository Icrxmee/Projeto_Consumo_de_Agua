require("dotenv").config()

const mysql = require("mysql2")
const fs = require("fs")
const path = require("path")

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,

ssl: {
    rejectUnauthorized: false
}
})


pool.getConnection((err, connection) => {
    if (err) {
        console.error("Erro ao conectar no banco:", err)
        return
    }

    console.log("Conectado ao MySQL")
    connection.release()
})

module.exports = pool