import express from "express"
import pkg from "pg"
import dotenv from "dotenv"
import Joi from "joi"
dotenv.config()
const { Pool } = pkg

const app = express()
app.use(express.json())

//schemas
const categorieSchema = Joi.object({
    name: Joi.string().min(3).required() 
})

//conexão com o banco
const connectiondb = new Pool({
    connectionString: process.env.DATABASE_URL,
})

//categorias
app.post('/categories', async (req, res) => {
    const category = req.body

    try {
        const { error } = categorieSchema.validate(category, {abortEarly: false})
        if(error){
            const erros = error.details.map((detail) => detail.message)
            return res.status(400).send(erros)
        }

        const { rows } = await connectiondb.query("SELECT * FROM categories WHERE name = $1;", [category.name])
        if(rows.length > 0){
            return res.status(409).send({message: 'Esta categoria já existe.'})
        }

        await connectiondb.query('INSERT INTO categories (name) VALUES ($1)', [category.name])

        res.sendStatus(201)
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }

})

app.get('/categories', async(req, res) => {
    try {
        const categories = await connectiondb.query('SELECT * FROM categories;')
        res.send(categories.rows)
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})

const port = process.env.PORT || 4000
app.listen(port, console.log(`Server is running in port: ${port}`))