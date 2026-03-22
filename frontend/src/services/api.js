import axios from 'axios';

const getBaseUrl = () => {
    if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
    return window.location.port === '5173' ? 'http://localhost:3000/api' : '/api';
};

const api = axios.create({
    baseURL: getBaseUrl(),
});

export const DashboardService = {
    getSummary: () => api.get('/dashboard').then(res => res.data),
};

export const SystemLogService = {
    getRecent: (limit) => api.get(`/logs?limit=${limit || 50}`).then(res => res.data),
    getRecentErrors: (minutes) => api.get(`/logs/errors?minutes=${minutes || 10}`).then(res => res.data),
};

export const ServerService = {
    getAll: () => api.get('/servers').then(res => res.data),
    getOne: (id) => api.get(`/servers/${id}`).then(res => res.data),
    create: (data) => api.post('/servers', data).then(res => res.data),
    update: (id, data) => api.put(`/servers/${id}`, data).then(res => res.data),
    delete: (id) => api.delete(`/servers/${id}`).then(res => res.data),
    executeCommand: (id, command) => api.post(`/servers/${id}/command`, { command }).then(res => res.data),
};

export const DockerService = {
    getContainers: (serverId) => api.get(`/docker/${serverId}/containers`).then(res => res.data),
    start: (serverId, containerId) => api.post('/docker/start', { serverId, containerId }).then(res => res.data),
    stop: (serverId, containerId) => api.post('/docker/stop', { serverId, containerId }).then(res => res.data),
    restart: (serverId, containerId) => api.post('/docker/restart', { serverId, containerId }).then(res => res.data),
    remove: (serverId, containerId) => api.delete(`/docker/${serverId}/${containerId}`).then(res => res.data),
    getLogs: (serverId, containerId, tail = 100) => api.get(`/docker/${serverId}/${containerId}/logs?tail=${tail}`).then(res => res.data)
};

export const ProxmoxService = {
    getNodes: (serverId) => api.get(`/proxmox/${serverId}/nodes`).then(res => res.data),
    getVMs: (serverId, node) => api.get(`/proxmox/${serverId}/nodes/${node}/vms`).then(res => res.data),
    controlVM: (data) => api.post('/proxmox/vm/control', data).then(res => res.data),
};

export const DiscoveryService = {
    scan: () => api.post('/discovery/scan').then(res => res.data),
    getDiscovered: () => api.get('/discovery/discovered').then(res => res.data),
};

export const SettingsService = {
    getSettings: () => api.get('/settings').then(res => res.data),
    updateSettings: (data) => api.post('/settings', data).then(res => res.data),
    testTelegram: () => api.post('/settings/test-telegram').then(res => res.data),
};

export const SSHKeyService = {
    getAll: () => api.get('/ssh-keys').then(res => res.data),
    generate: (name, type) => api.post('/ssh-keys/generate', { name, type }).then(res => res.data),
    addManual: (name, public_key, private_key) => api.post('/ssh-keys/add-manual', { name, public_key, private_key }).then(res => res.data),
    getServerStatus: (serverId) => api.get(`/ssh-keys/server-status/${serverId}`).then(res => res.data),
    configureSshd: (serverId) => api.post('/ssh-keys/configure-sshd', { serverId }).then(res => res.data),
    pushToServer: (id, serverId) => api.post(`/ssh-keys/${id}/push`, { serverId }).then(res => res.data),
    delete: (id) => api.delete(`/ssh-keys/${id}`).then(res => res.data),
};
