/**
 * Author: Nguyễn Quang Huy 
 * facebook: https://www.facebook.com/QuangHuy.Nguyennn/
 */
const systemLogController = require('../controllers/systemLogController');
const router = require('express').Router();

router.get('/', systemLogController.getRecent);
router.get('/errors', systemLogController.getRecentErrors);

module.exports = router;
