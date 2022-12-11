import express from "express"
import pkg from "pg"
import dotenv from "dotenv"
dotenv.config()
const { Pool } = pkg

const app = express()
app.use(express.json())

const connectiondb = new Pool({
    connectionString: process.env.DATABASE_URL,
})


const port = process.env.PORT || 4000
app.listen(port, console.log(`Server is running in port: ${port}`))