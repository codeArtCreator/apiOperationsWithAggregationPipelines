const ProductModel = require('../models/productSchema')
const axios = require('axios');
require('dotenv').config()

const PORT = process.env.PORT || 3000;
const THIRD_PARTY_API = process.env.THIRD_PARTY_API

const saveToDatabase = async (req, res) => {
    try {
        // Fetch data from the third-party API
        const response = await axios.get(THIRD_PARTY_API);
        const jsonData = response.data;

        // Insert the seed data into the database
        await ProductModel.insertMany(jsonData);

        res.status(200).json({ message: 'Database initialized successfully.' });
    } catch (error) {
        console.error('Error initializing the database:', error.message);
        res.status(500).json({ message: 'Database initialization failed.' });
    }
}

const fetchStatistics = async (req, res) => {
    try {
        const { month } = req.params;
        const targetMonth = parseInt(month);
        const statistics = await ProductModel.aggregate([
            {
                $facet: {
                    // Total sale amount of selected month
                    totalSaleAmount: [
                        {
                            $addFields: {
                                month: { $month: { $toDate: '$dateOfSale' } },
                            },
                        },
                        {
                            $match: {
                                month: targetMonth,
                                sold: true,
                            },
                        },
                        {
                            $group: {
                                _id: null,
                                totalSaleAmount: {
                                    $sum: '$price',
                                },
                            },
                        },
                        {
                            $project: {
                                _id: 0,
                                totalSaleAmount: 1,
                            },
                        },
                    ],
                    // Total number of sold items of selected month
                    totalSoldItems: [
                        {
                            $addFields: {
                                month: { $month: { $toDate: '$dateOfSale' } },
                            },
                        },
                        {
                            $match: {
                                month: targetMonth,
                                sold: true,
                            },
                        },
                        {
                            $count: 'totalSoldItems',
                        },
                    ],
                    // Total number of not sold items of selected month
                    totalNotSoldItems: [
                        {
                            $addFields: {
                                month: { $month: { $toDate: '$dateOfSale' } },
                            },
                        },
                        {
                            $match: {
                                month: targetMonth,
                                sold: false,
                            },
                        },
                        {
                            $count: 'totalNotSoldItems',
                        },
                    ],
                },
            },
            {
                $project: {
                    totalSaleAmount: { $ifNull: [{ $arrayElemAt: ['$totalSaleAmount.totalSaleAmount', 0] }, 0] },
                    totalSoldItems: { $ifNull: [{ $arrayElemAt: ['$totalSoldItems.totalSoldItems', 0] }, 0] },
                    totalNotSoldItems: { $ifNull: [{ $arrayElemAt: ['$totalNotSoldItems.totalNotSoldItems', 0] }, 0] },
                },
            },
        ]);

        const result = statistics[0];

        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching statistics:', error.message);
        res.status(500).json({ message: 'Error fetching statistics.' });
    }
};

const fetchBarChartData = async (req, res) => {
    try {
        const { month } = req.params;
        const targetMonth = parseInt(month);

        const barChart = await ProductModel.aggregate([
            {
                $addFields: {
                    month: { $month: { $toDate: '$dateOfSale' } },
                },
            },
            {
                $match: {
                    month: targetMonth,
                },
            },
            {
                $bucket: {
                    groupBy: '$price',
                    boundaries: [0, 101, 201, 301, 401, 501, 601, 701, 801, 901, Infinity],
                    default: '901-above',
                    output: {
                        count: { $sum: 1 },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    priceRange: {
                        $concat: [
                            { $toString: '$_id' },
                            ' - ',
                            {
                                $cond: {
                                    if: { $eq: ['$_id', 901] },
                                    then: 'above',
                                    else: { $toString: { $add: ['$_id', 99] } },
                                },
                            },
                        ],
                    },
                    count: 1,
                },
            },
        ]);

        res.status(200).json(barChart);
    } catch (error) {
        console.error('Error fetching bar chart data:', error.message);
        res.status(500).json({ message: 'Error fetching bar chart data.' });
    }
}

const fetchPieChartData = async (req, res) => {
    try {
        const { month } = req.params;
        const targetMonth = parseInt(month);

        const pieChart = await ProductModel.aggregate([
            {
                $addFields: {
                    month: { $month: { $toDate: '$dateOfSale' } },
                },
            },
            {
                $match: {
                    month: targetMonth,
                },
            },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                },
            },
            {
                $project: {
                    category: '$_id',
                    count: 1,
                    _id: 0,
                },
            },
        ]);

        res.status(200).json(pieChart);
    } catch (error) {
        console.error('Error fetching pie chart data:', error.message);
        res.status(500).json({ message: 'Error fetching pie chart data.' });
    }
}

const fetchStatisticsData = async (month) => {
    try {
        const [statistics, barChart, pieChart] = await Promise.all([
            axios.get(`http://localhost:${PORT}/api/v1/statistics/${month}`),
            axios.get(`http://localhost:${PORT}/api/v1/bar-chart/${month}`),
            axios.get(`http://localhost:${PORT}/api/v1/pie-chart/${month}`),
        ]);

        return {
            statistics: statistics.data,
            barChart: barChart.data,
            pieChart: pieChart.data,
        };
    } catch (error) {
        throw new Error('Error fetching statistics data.');
    }
};
const fetchCompainedData = async (req, res) => {
    try {
        const { month } = req.params;
        const combinedData = await fetchStatisticsData(month);
        console.log(combinedData);
        res.status(200).json(combinedData);
    } catch (error) {
        console.error('Error fetching combined data:', error.message);
        res.status(500).json({ message: 'Error fetching combined data.' });
    }
}

module.exports = {
    saveToDatabase,
    fetchStatistics,
    fetchBarChartData,
    fetchPieChartData,
    fetchCompainedData
}