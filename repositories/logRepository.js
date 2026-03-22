/**
 * Author: Nguyễn Quang Huy 
 * facebook: https://www.facebook.com/QuangHuy.Nguyennn/
 */
const db = require('../database/db');

class LogRepository {
    async create(logData) {
        const { server_id, command, output } = logData;
        const sql = 'INSERT INTO command_logs (server_id, command, output) VALUES (?, ?, ?)';
        const result = await db.run(sql, [server_id, command, output]);
        return result.id;
    }

    async findByServerId(serverId, limit = 100) {
        const sql = 'SELECT * FROM command_logs WHERE server_id = ? ORDER BY timestamp DESC LIMIT ?';
        return await db.query(sql, [serverId, limit]);
    }

    async clearLogs(serverId) {
        const sql = 'DELETE FROM command_logs WHERE server_id = ?';
        await db.run(sql, [serverId]);
    }
}

module.exports = new LogRepository();
