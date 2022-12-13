export async function getRentals(req, res) {
    const { customerId, gameId } = req.query;
    
    try {
      if (customerId) {
        const customer = await connectionDB.query(`
            SELECT
              *
            FROM
              customers
            WHERE
              id = $1;`, [customerId]);
  
        if (customer.rowCount === 0) {
          return res.sendStatus(httpStatus.NOT_FOUND);
        }
  
        const rentals = await connectionDB.query(`
          SELECT
            rentals.*,
            customers.id AS "customer.id",
            customers.name AS "customer.name",
            games.id AS "game.id",
            games.name AS "game.name",
            games."categoryId" AS "game.categoryId",
            categories.name AS "game.categoryName"
          FROM
            rentals
            JOIN customers ON rentals."customerId" = customers.id
            JOIN games ON rentals."gameId" = games.id
            JOIN categories ON games."categoryId" = categories.id
          WHERE
            rentals."customerId" = $1;`, [customerId]);
  
        const result = rentals?.rows.map(value => ({
          id: value.id,
          customerId: value.customerId,
          gameId: value.gameId,
          rentDate: value.rentDate,
          daysRented: value.daysRented,
          returnDate: value.returnDate,
          originalPrice: value.originalPrice,
          delayFee: value.delayFee,
          customer: {
            id: value['customer.id'],
            name: value['customer.name']
          },
          game: {
            id: value['game.id'],
            name: value['game.name'],
            categoryId: value['game.categoryId'],
            categoryName: value['game.categoryName']
          }
          }));
  
        return res.send(result); 
      }
  
      if (gameId) {
        const game = await connectionDB.query(`
            SELECT
              *
            FROM
              games
            WHERE
              id = $1;`, [gameId]);
  
        if (game.rowCount === 0) {
          return res.sendStatus(httpStatus.NOT_FOUND);
        }
  
        const rentals = await connectionDB.query(`
          SELECT
            rentals.*,
            customers.id AS "customer.id",
            customers.name AS "customer.name",
            games.id AS "game.id",
            games.name AS "game.name",
            games."categoryId" AS "game.categoryId",
            categories.name AS "game.categoryName"
          FROM
            rentals
            JOIN customers ON rentals."customerId" = customers.id
            JOIN games ON rentals."gameId" = games.id
            JOIN categories ON games."categoryId" = categories.id
          WHERE
            rentals."gameId" = $1;`, [gameId]);
  
        const result = rentals?.rows.map(value => ({
          id: value.id,
          customerId: value.customerId,
          gameId: value.gameId,
          rentDate: value.rentDate,
          daysRented: value.daysRented,
          returnDate: value.returnDate,
          originalPrice: value.originalPrice,
          delayFee: value.delayFee,
          customer: {
            id: value['customer.id'],
            name: value['customer.name']
          },
          game: {
            id: value['game.id'],
            name: value['game.name'],
            categoryId: value['game.categoryId'],
            categoryName: value['game.categoryName']
          }
        }));
  
        return res.send(result); 
      }
  
      const rentals = await connectionDB.query(`
        SELECT
          rentals.*,
          customers.id AS "customer.id",
          customers.name AS "customer.name",
          games.id AS "game.id",
          games.name AS "game.name",
          games."categoryId" AS "game.categoryId",
          categories.name AS "game.categoryName"
        FROM
          rentals
          JOIN customers ON rentals."customerId" = customers.id
          JOIN games ON rentals."gameId" = games.id
          JOIN categories ON games."categoryId" = categories.id;`);
      
        const result = rentals?.rows.map(value => ({
          id: value.id,
          customerId: value.customerId,
          gameId: value.gameId,
          rentDate: value.rentDate,
          daysRented: value.daysRented,
          returnDate: value.returnDate,
          originalPrice: value.originalPrice,
          delayFee: value.delayFee,
          customer: {
            id: value['customer.id'],
            name: value['customer.name']
          },
          game: {
            id: value['game.id'],
            name: value['game.name'],
            categoryId: value['game.categoryId'],
            categoryName: value['game.categoryName']
          }
        }));
  
      res.send(result);
  
    } catch (error) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).send(error.message);
    }
  };
  