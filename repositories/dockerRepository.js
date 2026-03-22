/**
 * Author: Nguyễn Quang Huy 
 * facebook: https://www.facebook.com/QuangHuy.Nguyennn/
 */
const db = require('../database/db');

class DockerRepository {
    async findByServerId(serverId) {
        const sql = 'SELECT * FROM docker_containers WHERE server_id = ?';
        return await db.query(sql, [serverId]);
    }

    async upsert(containerData) {
        const { server_id, container_id, name, image, status, status_text, error_detail, restart_count } = containerData;
        const sql = `
      INSERT OR REPLACE INTO docker_containers (server_id, container_id, name, image, status, status_text, error_detail, restart_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
        const result = await db.run(sql, [server_id, container_id, name, image, status, status_text, error_detail, restart_count]);
        return result.changes > 0;
    }

    async deleteByServerId(serverId) {
        const sql = 'DELETE FROM docker_containers WHERE server_id = ?';
        const result = await db.run(sql, [serverId]);
        return result.changes > 0;
    }

    async deleteOrphaned(serverId, currentContainerIds) {
        if (!currentContainerIds || currentContainerIds.length === 0) {
            return await this.deleteByServerId(serverId);
        }
        const placeholders = currentContainerIds.map(() => '?').join(',');
        const sql = `DELETE FROM docker_containers WHERE server_id = ? AND container_id NOT IN (${placeholders})`;
        const result = await db.run(sql, [serverId, ...currentContainerIds]);
        return result.changes > 0;
    }
}

module.exports = new DockerRepository();
