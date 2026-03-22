/**
 * Author: Nguyễn Quang Huy 
 * facebook: https://www.facebook.com/QuangHuy.Nguyennn/
 */
const express = require('express');
const router = express.Router();
const serverController = require('../controllers/serverController');

router.get('/', serverController.getAll);
router.get('/:id', serverController.getOne);
router.post('/', serverController.create);
router.put('/:id', serverController.update);
router.delete('/:id', serverController.delete);

router.post('/:id/command', serverController.executeCommand);
router.post('/:id/check', serverController.checkConnection);

module.exports = router;
