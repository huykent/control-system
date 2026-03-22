/**
 * Author: Nguyễn Quang Huy 
 * facebook: https://www.facebook.com/QuangHuy.Nguyennn/
 */
const express = require('express');
const router = express.Router();
const sshKeyController = require('../controllers/sshKeyController');

router.get('/', sshKeyController.list);
router.post('/generate', sshKeyController.generate);
router.post('/add-manual', sshKeyController.addManual);
router.get('/server-status/:serverId', sshKeyController.getSshStatus);
router.post('/configure-sshd', sshKeyController.configureSshd);
router.post('/:id/push', sshKeyController.pushToServer);
router.get('/:id/download', sshKeyController.download);
router.delete('/:id', sshKeyController.delete);

module.exports = router;
