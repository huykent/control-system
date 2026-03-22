/**
 * Author: Nguyễn Quang Huy 
 * facebook: https://www.facebook.com/QuangHuy.Nguyennn/
 */
const db = require('../database/db');

class ServerRepository {
    async findAll() {
        const sql = 'SELECT * FROM servers ORDER BY created_at DESC';
        return await db.query(sql);
    }

    async findById(id) {
        const sql = 'SELECT * FROM servers WHERE id = ?';
        return await db.get(sql, [id]);
    }

    async create(serverData) {
        const { name, ip, port, username, auth_type, password, ssh_key_id, type } = serverData;
        const sql = `
      INSERT INTO servers (name, ip, port, username, auth_type, password, ssh_key_id, type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
        const result = await db.run(sql, [name, ip, port || 22, username, auth_type, password, ssh_key_id, type]);
        return result.id;
    }

    async update(id, serverData) {
        const { name, ip, port, username, auth_type, password, ssh_key_id, type, status } = serverData;
        const sql = `
      UPDATE servers 
      SET name = ?, ip = ?, port = ?, username = ?, auth_type = ?, password = ?, ssh_key_id = ?, type = ?, status = ?
      WHERE id = ?
    `;
        const result = await db.run(sql, [name, ip, port, username, auth_type, password, ssh_key_id, type, status, id]);
        return result.changes > 0;
    }

    async updateStatus(id, status) {
        const sql = 'UPDATE servers SET status = ? WHERE id = ?';
        const result = await db.run(sql, [status, id]);
        return result.changes > 0;
    }

    async delete(id) {
        const sql = 'DELETE FROM servers WHERE id = ?';
        const result = await db.run(sql, [id]);
        return result.changes > 0;
    }
}

module.exports = new ServerRepository();
