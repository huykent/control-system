/**
 * Author: Nguyễn Quang Huy 
 * facebook: https://www.facebook.com/QuangHuy.Nguyennn/
 */
const db = require('../database/db');

class SettingsRepository {
    async getAll() {
        const sql = 'SELECT * FROM settings';
        const rows = await db.query(sql);
        const settings = {};
        for (const row of rows) {
            settings[row.key] = row.value;
        }
        return settings;
    }

    async getByKey(key) {
        const sql = 'SELECT value FROM settings WHERE key = ?';
        const result = await db.get(sql, [key]);
        return result ? result.value : null;
    }

    async save(key, value) {
        const checkSql = 'SELECT key FROM settings WHERE key = ?';
        const exists = await db.get(checkSql, [key]);

        if (exists) {
            const updateSql = 'UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?';
            await db.run(updateSql, [String(value), key]);
        } else {
            const insertSql = 'INSERT INTO settings (key, value) VALUES (?, ?)';
            await db.run(insertSql, [key, String(value)]);
        }
    }

    async saveMultiple(settingsObj) {
        // Run sequentially to keep it simple, or in parallel
        for (const [key, value] of Object.entries(settingsObj)) {
            await this.save(key, value);
        }
    }
}

module.exports = new SettingsRepository();
