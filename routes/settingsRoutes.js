const settingsController = require('../controllers/settingsController');
/**
 * Author: Nguyễn Quang Huy 
 * facebook: https://www.facebook.com/QuangHuy.Nguyennn/
 */
const router = require('express').Router();

router.get('/', settingsController.getSettings);
router.post('/', settingsController.updateSettings);
router.post('/test-telegram', settingsController.testTelegram);

module.exports = router;
