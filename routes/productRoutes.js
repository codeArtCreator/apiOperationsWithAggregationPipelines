const express = require('express')
const router = express.Router()
const {
    saveToDatabase,
    fetchStatistics,
    fetchBarChartData,
    fetchPieChartData,
    fetchCompainedData
} = require('../controllers/productControllers')
const ProductModel = require('../models/productSchema')

// API endpoint to initialize the database
router.get('/saveto-database', saveToDatabase);

// API endpoint for statistics
router.get('/statistics/:month', fetchStatistics);

// API endpoint for bar chart
router.get('/bar-chart/:month', fetchBarChartData);

//API endpoint for pie chart
router.get('/pie-chart/:month', fetchPieChartData);

//API endpoint for compained data from 3 APIs mentioned above
router.get('/compained/:month', fetchCompainedData);


module.exports = router