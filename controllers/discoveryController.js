const lanScanner = require('../discovery/lanScanner');

class DiscoveryController {
    async scan(req, res) {
        try {
            const hosts = await lanScanner.scan();
            res.json({ success: true, data: hosts, error: null });
        } catch (err) {
            res.status(500).json({ success: false, data: null, error: err.message });
        }
    }

    async getDiscovered(req, res) {
        try {
            const hosts = await lanScanner.getDiscovered();
            res.json({ success: true, data: hosts, error: null });
        } catch (err) {
            res.status(500).json({ success: false, data: null, error: err.message });
        }
    }
}

module.exports = new DiscoveryController();
