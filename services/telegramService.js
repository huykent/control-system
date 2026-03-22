/**
 * Author: Nguyễn Quang Huy 
 * facebook: https://www.facebook.com/QuangHuy.Nguyennn/
 */
const https = require('https');
const settingsRepository = require('../repositories/settingsRepository');

class TelegramService {
    constructor() {
        this.offset = 0;
        this.isPolling = false;
    }

    async initBot() {
        if (this.isPolling) return;
        this.isPolling = true;
        console.log('Telegram Bot Command Listener started.');
        this.poll();
    }

    async poll() {
        while (this.isPolling) {
            try {
                const botToken = await settingsRepository.getByKey('TELEGRAM_BOT_TOKEN') || process.env.TELEGRAM_BOT_TOKEN;
                if (!botToken) {
                    await new Promise(r => setTimeout(r, 10000));
                    continue;
                }

                const updates = await this.getUpdates(botToken);
                for (const update of updates) {
                    this.offset = update.update_id + 1;
                    await this.handleUpdate(update);
                }
            } catch (err) {
                console.error('Telegram polling error:', err.message);
                await new Promise(r => setTimeout(r, 5000));
            }
            await new Promise(r => setTimeout(r, 2000));
        }
    }

    async getUpdates(token) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'api.telegram.org',
                path: `/bot${token}/getUpdates?offset=${this.offset}&timeout=30`,
                method: 'GET'
            };
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        if (json.ok) resolve(json.result);
                        else reject(new Error(json.description));
                    } catch (e) { reject(e); }
                });
            });
            req.on('error', reject);
            req.end();
        });
    }

    async handleUpdate(update) {
        const chatIdConfig = await settingsRepository.getByKey('TELEGRAM_CHAT_ID') || process.env.TELEGRAM_CHAT_ID;

        if (update.message) {
            const { chat, text } = update.message;
            if (String(chat.id) !== String(chatIdConfig)) {
                console.warn(`Unauthorized access attempt from Chat ID: ${chat.id}`);
                return;
            }

            if (text === '/start' || text === '/menu') {
                await this.sendMenu(chat.id);
            } else if (text === '/servers') {
                await this.listServers(chat.id);
            }
        } else if (update.callback_query) {
            const { id, message, data } = update.callback_query;
            if (String(message.chat.id) !== String(chatIdConfig)) return;

            await this.handleCallback(update.callback_query);
            this.answerCallback(id);
        }
    }

    async handleCallback(query) {
        const data = query.data;
        const chatId = query.message.chat.id;

        if (data === 'menu:servers') {
            await this.listServers(chatId);
        } else if (data.startsWith('srv:')) {
            const serverId = data.split(':')[1];
            await this.serverActions(chatId, serverId);
        } else if (data.startsWith('doc:list:')) {
            const serverId = data.split(':')[2];
            await this.listContainers(chatId, serverId);
        } else if (data.startsWith('doc:restart:')) {
            const [, , serverId, containerId] = data.split(':');
            await this.restartContainer(chatId, serverId, containerId);
        }
    }

    async sendMenu(chatId) {
        await this.sendMessage(chatId, '🎛 *Control System Main Menu*', {
            inline_keyboard: [
                [{ text: '🖥 Servers List', callback_data: 'menu:servers' }]
            ]
        });
    }

    async listServers(chatId) {
        const serverRepository = require('../repositories/serverRepository');
        const servers = await serverRepository.findAll();

        if (servers.length === 0) {
            await this.sendMessage(chatId, 'No servers found.');
            return;
        }

        const keyboard = servers.map(s => ([{
            text: `${s.status === 'online' ? '🟢' : '🔴'} ${s.name} (${s.ip})`,
            callback_data: `srv:${s.id}`
        }]));

        await this.sendMessage(chatId, '📑 *Available Servers*', { inline_keyboard: keyboard });
    }

    async serverActions(chatId, serverId) {
        const serverRepository = require('../repositories/serverRepository');
        const s = await serverRepository.findById(serverId);
        if (!s) return;

        const keyboard = [
            [{ text: '🐳 List Containers', callback_data: `doc:list:${serverId}` }],
            [{ text: '🔙 Back to Servers', callback_data: 'menu:servers' }]
        ];

        await this.sendMessage(chatId, `🖥 *Server:* ${s.name}\nIP: \`${s.ip}\`\nStatus: \`${s.status}\`\nType: \`${s.type}\``, { inline_keyboard: keyboard });
    }

    async listContainers(chatId, serverId) {
        const dockerService = require('./dockerService');
        const containers = await dockerService.listContainers(serverId);

        if (containers.length === 0) {
            await this.sendMessage(chatId, 'No containers found on this server.');
            return;
        }

        const keyboard = containers.map(c => ([{
            text: `${c.status === 'running' ? '✅' : '🛑'} ${c.name}`,
            callback_data: `doc:restart:${serverId}:${c.container_id}`
        }]));

        keyboard.push([{ text: '🔙 Back to Server', callback_data: `srv:${serverId}` }]);

        await this.sendMessage(chatId, '🐳 *Select a container to RESTART*', { inline_keyboard: keyboard });
    }

    async restartContainer(chatId, serverId, containerId) {
        const dockerService = require('./dockerService');
        try {
            await this.sendMessage(chatId, `🔄 Restarting container \`${containerId.substring(0, 12)}\`...`);
            await dockerService.restartContainer(serverId, containerId);
            await this.sendMessage(chatId, `✅ Container restarted successfully!`);
            await this.listContainers(chatId, serverId);
        } catch (err) {
            await this.sendMessage(chatId, `❌ Failed to restart container: ${err.message}`);
        }
    }

    async sendMessage(chatId, text, replyMarkup = null) {
        const botToken = await settingsRepository.getByKey('TELEGRAM_BOT_TOKEN') || process.env.TELEGRAM_BOT_TOKEN;
        if (!botToken) return;

        const data = JSON.stringify({
            chat_id: chatId,
            text: text,
            parse_mode: 'Markdown',
            reply_markup: replyMarkup
        });

        const options = {
            hostname: 'api.telegram.org',
            path: `/bot${botToken}/sendMessage`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const req = https.request(options);
        req.on('error', (e) => console.error('Error sending message:', e.message));
        req.write(data);
        req.end();
    }

    async answerCallback(callbackQueryId) {
        const botToken = await settingsRepository.getByKey('TELEGRAM_BOT_TOKEN') || process.env.TELEGRAM_BOT_TOKEN;
        if (!botToken) return;

        const options = {
            hostname: 'api.telegram.org',
            path: `/bot${botToken}/answerCallbackQuery?callback_query_id=${callbackQueryId}`,
            method: 'GET'
        };
        const req = https.request(options);
        req.end();
    }

    async sendAlert(message) {
        const chatId = await settingsRepository.getByKey('TELEGRAM_CHAT_ID') || process.env.TELEGRAM_CHAT_ID;
        if (!chatId) return;
        await this.sendMessage(chatId, `🚨 *Control System Alert* 🚨\n\n${message}`);
    }

    async testAlert() {
        const chatId = await settingsRepository.getByKey('TELEGRAM_CHAT_ID') || process.env.TELEGRAM_CHAT_ID;
        if (!chatId) throw new Error('Chat ID not configured');
        await this.sendMessage(chatId, '✅ This is a test notification from your Control System. Your configuration is correct!');
        this.initBot();
    }
}

module.exports = new TelegramService();
