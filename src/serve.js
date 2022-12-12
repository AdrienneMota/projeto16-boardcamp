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

const gameSchema = Joi.object({
    name: Joi.string().min(1).required(),
    image: Joi.string().trim(true).required(),
    stockTotal: Joi.number().integer().greater(0).required(),
    categoryId: Joi.number().integer().greater(0).required(),
    pricePerDay: Joi.number().greater(0).required()
})

const customerSchema = Joi.object({
    name: Joi.string().min(1).required(),
    phone: Joi.string().min(10).max(11),
    cpf: Joi.string().min(11).required(),
    birthday: Joi.string().min(1).required()    
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

//jogos
app.post('/games', async (req, res) => {
    const game = req.body

    try {
        const { error } = gameSchema.validate(game, {abortEarly: false})
        if(error){
            const erros = error.details.map((detail) => detail.message)
            return res.status(400).send(erros)
        }

        const categoryExist = await connectiondb.query("SELECT * FROM categories WHERE id = $1;", [game.categoryId])
        if(categoryExist.rows.length < 1){
            return res.status(400).send({message: 'A categoria informada não existe.'})
        }

        const { rows } = await connectiondb.query("SELECT * FROM games WHERE name = $1;", [game.name])
        if(rows.length > 0){
            return res.status(409).send({message: 'O nome informado já existe.'})
        }

        const {name, image, stockTotal, categoryId, pricePerDay} = game

        await connectiondb.query(
            'INSERT INTO games ("name", "image", "stockTotal", "categoryId", "pricePerDay") VALUES ($1, $2, $3, $4, $5);', 
            [name, image, stockTotal, categoryId, pricePerDay]
            )

        res.sendStatus(201)
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }

})

app.get('/games', async(req, res) => {
    try {
        const name = req.query.name

        let query = ""

        if(name){
            query = `WHERE g.name ilike '%${name}%'`
        }

        const games = await connectiondb.query(`SELECT g.*, c.name "categoryName" FROM games g JOIN categories c ON c.id = g."categoryId" ${query};`)
        res.send(games.rows)
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})

//clientes

app.post('/customers', async (req, res) => {
    const customer = req.body

    try {
        const { error } = customerSchema.validate(customer, {abortEarly: false})
        if(error){
            const erros = error.details.map((detail) => detail.message)
            return res.status(400).send(erros)
        }

        const cpfExist = await connectiondb.query("SELECT * FROM customers WHERE cpf = $1;", [customer.cpf])
        if(cpfExist.rows.length > 0){
            return res.status(400).send({message: 'O cpf do cliente informado já existe.'})
        }


        const {name, phone, cpf, birthday} = customer

        await connectiondb.query(
            'INSERT INTO customers ("name", "phone", "cpf", "birthday") VALUES ($1, $2, $3, $4);', 
            [name, phone, cpf, birthday]
            )

        res.sendStatus(201)
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }

})

const port = process.env.PORT || 4000
app.listen(port, console.log(`Server is running in port: ${port}`))