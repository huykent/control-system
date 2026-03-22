const dashboardController = require('../controllers/dashboardController');

const router = require('express').Router();

router.get('/', dashboardController.getSummary);

module.exports = router;
