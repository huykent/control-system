/**
 * Author: Nguyễn Quang Huy 
 * facebook: https://www.facebook.com/QuangHuy.Nguyennn/
 */
const express = require('express');
const router = express.Router();
const proxmoxController = require('../controllers/proxmoxController');

router.get('/:serverId/nodes', proxmoxController.getNodes);
router.get('/:serverId/nodes/:node/vms', proxmoxController.getVMs);
router.post('/vm/control', proxmoxController.controlVM);

module.exports = router;
