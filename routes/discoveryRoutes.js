/**
 * Author: Nguyễn Quang Huy 
 * facebook: https://www.facebook.com/QuangHuy.Nguyennn/
 */
const express = require('express');
const router = express.Router();
const discoveryController = require('../controllers/discoveryController');

router.post('/scan', discoveryController.scan);
router.get('/discovered', discoveryController.getDiscovered);

module.exports = router;
