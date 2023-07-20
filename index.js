const express = require('express');
const cors = require('cors')
const productRoute = require('./src/routes/productRoutes')

const app = express();
app.use(express.json())
app.use(cors())

app.use('/api/v1', productRoute)

module.exports = app