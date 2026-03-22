/**
 * Author: Nguyễn Quang Huy 
 * facebook: https://www.facebook.com/QuangHuy.Nguyennn/
 */
const express = require('express');
const router = express.Router();
const dockerController = require('../controllers/dockerController');

router.get('/:serverId/containers', dockerController.list);
router.post('/start', dockerController.start);
router.post('/stop', dockerController.stop);
router.post('/restart', dockerController.restart);
router.delete('/:serverId/:containerId', dockerController.remove);
router.get('/:serverId/:containerId/logs', dockerController.logs);

module.exports = router;
