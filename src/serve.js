import express from "express"
import pkg from "pg"
import dotenv from "dotenv"
import Joi from "joi"
import dayjs from "dayjs"
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

const rentSchema = Joi.object({
    customerId: Joi.number().integer().required(),
    gameId: Joi.number().integer().required(),
    daysRented: Joi.number().integer().greater(0).required()
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

app.get('/customers/:id', async(req, res) => {
    try {
        const id = parseInt(req.params.id)

        const customer = await connectiondb.query('SELECT * FROM customers WHERE id = $1;', [id])

        if(customer.rows.length < 1){
            return res.status(404).send({message: 'Id incorreto'})
        }

        res.send(customer.rows)
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})

app.get('/customers', async(req, res) => {
    try {
        const customers = await connectiondb.query('SELECT * FROM customers;')

        res.send(customers.rows)
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})

app.put('/customers/:id', async(req, res) => {
    const id = parseInt(req.params.id)
    const customer = req.body
    console.log(id)
    try {
        const { error } = customerSchema.validate(customer, {abortEarly: false})
        if(error){
            const erros = error.details.map((detail) => detail.message)
            return res.status(400).send(erros)
        }
     
        const cpfExist = await connectiondb.query("SELECT * FROM customers WHERE cpf = $1 AND id <> $2;", [customer.cpf, id])
        if(cpfExist.rows.length > 0){
            return res.status(409).send({message: 'O cpf do cliente informado já existe.'})
        }

        const {name, phone, cpf, birthday} = customer
        console.log(customer)
        await connectiondb.query(
            'UPDATE customers SET name=$1, phone=$2, cpf=$3, birthday=$4 WHERE id=$5;', 
            [name, phone, cpf, birthday, id]
            )

        res.sendStatus(200)
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }  
})

//alugueis 
//DELETE FROM customers WHERE id=1; 

app.post('/rentals', async (req, res) => {
    const rent = req.body

    try {
        const { error } = rentSchema.validate(rent, {abortEarly: false})
        if(error){
            const erros = error.details.map((detail) => detail.message)
            return res.status(400).send(erros)
        }

        const customerIdExist = await connectiondb.query("SELECT * FROM customers WHERE id = $1;", [rent.customerId])
        if(customerIdExist.rows.length < 1){
            return res.status(400).send({message: 'O id do cliente não foi encontrado'})
        }

        const gameIdExist = await connectiondb.query("SELECT * FROM games WHERE id = $1;", [rent.gameId])
        if(gameIdExist.rows.length < 1){
            return res.status(400).send({message: 'O id game não foi encontrado'})
        }

        //verificar aluguel

        const rentsgame = await connectiondb.query('SELECT COUNT(*) FROM rentals WHERE "gameId"=$1', [rent.gameId])
        const stock = await connectiondb.query('SELECT "stockTotal" FROM games WHERE id=$1', [rent.gameId])
        if(rentsgame>stock){
            return res.status(400).send({message: "Não há jogos disponíveis para alugar."})
        }        

        //população dos demais campos

        rent.rentDate = dayjs().format('YYYY-MM-DD')

        const price = await connectiondb.query('SELECT "pricePerDay" FROM games WHERE id = $1;', [rent.gameId])
        
        rent.originalPrice = price.rows[0].pricePerDay * rent.daysRented

        rent.returnDate = null

        rent.delayFee = null

        await connectiondb.query(
            'INSERT INTO rentals ("customerId", "gameId", "rentDate", "daysRented", "returnDate", "originalPrice", "delayFee") VALUES ($1, $2, $3, $4, $5, $6, $7);', 
            [rent.customerId, rent.gameId, rent.rentDate, rent.daysRented, rent.returnDate, rent.originalPrice, rent.delayFee]
            )
    
        res.sendStatus(201)
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }

})

app.get('/rentals', async(req, res) => {
    try {
        const gameId = req.query.gameId
        const customerId = req.query.customerId

        let query = ""

        if(gameId){
            query = `WHERE rentals."gameId" = ${gameId}`
        }
        
        if(customerId){
            query = `WHERE rentals."customerId" = ${customerId}`
        }

        const rentals = await connectiondb.query(`
            SELECT rentals.*,
                customers.id AS "customer.id",
                customers.name AS "customer.name",
                games.id AS "game.id",
                games.name AS "game.name",
                games."categoryId" AS "game.categoryId",
                categories.name AS "game.categoryName"
            FROM
                rentals
            JOIN
                customers ON rentals."customerId" = customers.id
            JOIN
                games ON rentals."gameId" = games.id
            JOIN
                categories ON games."categoryId" = categories.id
            ${query}
        `)

        const rentalShowMode = rentals?.rows.map( (r) => ({
            id: r.id,
            customerId: r.customerId,
            gameId: r.gameId,
            rentDate: r.rentDate,
            daysRented: r.daysRented,
            returnDate: r.returnDate,
            originalPrice: r.originalPrice,
            delayFee: r.delayFee,
            customer: {
                id: r['customer.id'],
                name: r['customer.name']
            },
            game:{
                id:r['game.id'],
                name: r['game.game'],
                categoryId: r['game.categoryId'],
                categoryName: r['game.categoryName']
            }
        }))
        res.send(rentalShowMode)
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})

const port = process.env.PORT || 4000
app.listen(port, console.log(`Server is running in port: ${port}`))