/**
 * Author: Nguyễn Quang Huy 
 * facebook: https://www.facebook.com/QuangHuy.Nguyennn/
 */
const db = require('../database/db');

class SshKeyRepository {
    async findAll() {
        return await db.query('SELECT id, name, public_key, created_at FROM ssh_keys ORDER BY created_at DESC');
    }

    async findById(id) {
        const rows = await db.query('SELECT * FROM ssh_keys WHERE id = ?', [id]);
        return rows[0];
    }

    async create(data) {
        const { name, public_key, private_key } = data;
        const result = await db.run(
            'INSERT INTO ssh_keys (name, public_key, private_key) VALUES (?, ?, ?)',
            [name, public_key, private_key]
        );
        return { id: result.lastID, name, public_key };
    }

    async delete(id) {
        return await db.run('DELETE FROM ssh_keys WHERE id = ?', [id]);
    }
}

module.exports = new SshKeyRepository();
