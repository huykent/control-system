const systemLogRepository = require('../repositories/systemLogRepository');

class SystemLogController {
    async getRecent(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 50;
            const logs = await systemLogRepository.getRecent(limit);
            res.json({ success: true, data: logs, error: null });
        } catch (err) {
            res.status(500).json({ success: false, data: null, error: err.message });
        }
    }

    async getRecentErrors(req, res) {
        try {
            const minutes = parseInt(req.query.minutes) || 10;
            const logs = await systemLogRepository.getRecentErrors(minutes);
            res.json({ success: true, data: logs, error: null });
        } catch (err) {
            res.status(500).json({ success: false, data: null, error: err.message });
        }
    }
}

module.exports = new SystemLogController();
