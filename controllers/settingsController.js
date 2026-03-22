const settingsRepository = require('../repositories/settingsRepository');

class SettingsController {
    async getSettings(req, res) {
        try {
            const settings = await settingsRepository.getAll();
            res.json({ success: true, data: settings, error: null });
        } catch (err) {
            res.status(500).json({ success: false, data: null, error: err.message });
        }
    }

    async updateSettings(req, res) {
        try {
            const settingsObj = req.body;
            if (typeof settingsObj !== 'object' || settingsObj === null) {
                return res.status(400).json({ success: false, data: null, error: 'Invalid payload' });
            }

            await settingsRepository.saveMultiple(settingsObj);
            res.json({ success: true, data: settingsObj, error: null });
        } catch (err) {
            res.status(500).json({ success: false, data: null, error: err.message });
        }
    }
    async testTelegram(req, res) {
        try {
            const telegramService = require('../services/telegramService');
            await telegramService.testAlert();
            res.json({ success: true, message: 'Test notification sent!', error: null });
        } catch (err) {
            res.status(500).json({ success: false, message: null, error: err.message });
        }
    }
}

module.exports = new SettingsController();
