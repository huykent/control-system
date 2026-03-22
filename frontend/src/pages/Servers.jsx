/**
 * Author: Nguyễn Quang Huy 
 * facebook: https://www.facebook.com/QuangHuy.Nguyennn/
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Server, HardDrive, Cpu, MoreVertical, Terminal as TerminalIcon, Info, Trash2, Key, Shield, Upload } from 'lucide-react';
import { ServerService, SSHKeyService } from '../services/api';
import { Link } from 'react-router-dom';

const Servers = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data: servers, isLoading } = useQuery({
        queryKey: ['servers'],
        queryFn: () => ServerService.getAll().then(res => res.data)
    });

    const { data: keys } = useQuery({
        queryKey: ['ssh-keys'],
        queryFn: () => SSHKeyService.getAll().then(res => res.data)
    });

    const [authType, setAuthType] = useState('password');
    const [selectedKey, setSelectedKey] = useState('');
    const [showUploadKey, setShowUploadKey] = useState(false);
    const [uploadKeyData, setUploadKeyData] = useState({ name: '', public_key: '', private_key: '' });

    const deleteMutation = useMutation({
        mutationFn: (id) => ServerService.delete(id),
        onSuccess: () => queryClient.invalidateQueries(['servers'])
    });

    const ServerCard = ({ server }) => {
        const isProxmox = server.type === 'proxmox';
        const Icon = isProxmox ? HardDrive : Server;
        const typeColor = isProxmox ? 'text-orange-500' : 'text-blue-500';

        return (
            <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden hover:border-dark-accent/50 transition-all flex flex-col group">
                <div className="p-6 flex-1">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-dark-bg p-3 rounded-xl border border-dark-border flex items-center gap-3">
                            <Icon size={24} className={typeColor} />
                            <span className="text-xs font-bold text-gray-400 bg-dark-border px-2 py-1 rounded-md uppercase tracking-wider">
                                {server.type}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${server.status === 'online' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]'}`} />
                        </div>
                    </div>

                    <h3 className="text-xl font-bold tracking-tight text-white truncate">{server.name}</h3>
                    <p className="text-gray-500 text-sm mb-4 font-mono">{server.ip}</p>

                    <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="bg-dark-bg/50 p-3 rounded-xl border border-dark-border">
                            <div className="flex items-center gap-2 text-gray-500 mb-1">
                                <Cpu size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">CPU</span>
                            </div>
                            <p className="text-sm font-bold text-white">{server.cpu || '--'}</p>
                        </div>
                        <div className="bg-dark-bg/50 p-3 rounded-xl border border-dark-border">
                            <div className="flex items-center gap-2 text-gray-500 mb-1">
                                <HardDrive size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">RAM</span>
                            </div>
                            <p className="text-sm font-bold text-white">{server.ram || '--'}</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-dark-bg/30 border-t border-dark-border flex gap-2">
                    <Link
                        to={`/terminal/${server.id}`}
                        className="flex-1 bg-dark-bg hover:bg-dark-border text-white text-xs font-bold py-2 rounded-lg border border-dark-border flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        <TerminalIcon size={14} />
                        Terminal
                    </Link>
                    <button
                        onClick={() => deleteMutation.mutate(server.id)}
                        className="p-2 border border-dark-border rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-center text-white">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Servers</h2>
                    <p className="text-gray-500 mt-1">Manage your connected infrastructure nodes.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-dark-accent hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all text-sm"
                >
                    <Plus size={18} />
                    Add Server
                </button>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <div key={i} className="bg-dark-card aspect-[4/3] rounded-2xl animate-pulse border border-dark-border" />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {servers?.map(server => (
                        <ServerCard key={server.id} server={server} />
                    ))}
                    {servers?.length === 0 && (
                        <div className="col-span-full py-20 bg-dark-card border border-dashed border-dark-border rounded-2xl flex flex-col items-center justify-center text-gray-500">
                            <div className="p-4 bg-dark-bg rounded-2xl mb-4">
                                <Info size={40} className="text-gray-600" />
                            </div>
                            <p className="font-bold text-lg">No servers connected</p>
                            <p className="text-sm">Click 'Add Server' to start managing your infrastructure.</p>
                        </div>
                    )}
                </div>
            )}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-dark-card border border-dark-border rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-dark-border bg-dark-bg/30">
                            <h3 className="text-xl font-bold text-white">Add New Server</h3>
                            <p className="text-gray-500 text-xs mt-1">Configure a new infrastructure node.</p>
                        </div>
                        <form className="p-6 space-y-4" onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            const data = Object.fromEntries(formData);
                            const payload = {
                                ...data,
                                auth_type: authType,
                                ssh_key_id: authType === 'key' ? selectedKey : null
                            };
                            ServerService.create(payload).then(() => {
                                queryClient.invalidateQueries(['servers']);
                                setIsModalOpen(false);
                                setAuthType('password');
                                setSelectedKey('');
                            });
                        }}>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Server Name</label>
                                <input name="name" type="text" required placeholder="Ubuntu-Server-01" className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-sm focus:border-dark-accent outline-none text-white transition-all shadow-inner" />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2 space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">IP Address</label>
                                    <input name="ip" type="text" required placeholder="192.168.1.100" className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-sm focus:border-dark-accent outline-none text-white transition-all" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Port</label>
                                    <input name="port" type="number" defaultValue="22" className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-sm focus:border-dark-accent outline-none text-white transition-all" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Username</label>
                                    <input name="username" type="text" required defaultValue="root" className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-sm focus:border-dark-accent outline-none text-white transition-all" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Auth Type</label>
                                    <select
                                        value={authType}
                                        onChange={(e) => setAuthType(e.target.value)}
                                        className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-sm focus:border-dark-accent outline-none text-white transition-all cursor-pointer"
                                    >
                                        <option value="password">Password</option>
                                        <option value="key">SSH Key Vault</option>
                                    </select>
                                </div>
                            </div>

                            {authType === 'password' ? (
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Password</label>
                                    <input name="password" type="password" required className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-sm focus:border-dark-accent outline-none text-white transition-all" />
                                </div>
                            ) : (
                                <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Select Identity Key</label>
                                    <div className="flex gap-2">
                                        <select
                                            value={selectedKey}
                                            onChange={(e) => setSelectedKey(e.target.value)}
                                            required
                                            className="flex-1 bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-sm focus:border-dark-accent outline-none text-white transition-all cursor-pointer"
                                        >
                                            <option value="" disabled>Choose a key...</option>
                                            {keys?.map(key => (
                                                <option key={key.id} value={key.id}>{key.name}</option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => setShowUploadKey(!showUploadKey)}
                                            className="p-2 bg-dark-bg border border-dark-border rounded-xl hover:text-dark-accent transition-colors"
                                            title="Upload Custom Key"
                                        >
                                            <Upload size={16} />
                                        </button>
                                    </div>

                                    {showUploadKey && (
                                        <div className="mt-3 p-4 bg-dark-bg/50 border border-dark-border rounded-2xl space-y-3 border-dashed animate-in fade-in zoom-in-95">
                                            <p className="text-[10px] text-gray-500 font-bold uppercase">Manual Key Import</p>
                                            <input
                                                type="text"
                                                placeholder="Key Label (e.g., My-Private-Key)"
                                                value={uploadKeyData.name}
                                                onChange={e => setUploadKeyData({ ...uploadKeyData, name: e.target.value })}
                                                className="w-full bg-dark-card border border-dark-border rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-dark-accent"
                                            />
                                            <textarea
                                                placeholder="Paste PRIVATE key here (Required for login)..."
                                                rows="3"
                                                value={uploadKeyData.private_key}
                                                onChange={e => setUploadKeyData({ ...uploadKeyData, private_key: e.target.value })}
                                                className="w-full bg-dark-card border border-dark-border rounded-lg px-3 py-1.5 text-[10px] font-mono text-blue-400 outline-none focus:border-dark-accent"
                                            ></textarea>
                                            <textarea
                                                placeholder="Paste PUBLIC key here (Optional)..."
                                                rows="2"
                                                value={uploadKeyData.public_key}
                                                onChange={e => setUploadKeyData({ ...uploadKeyData, public_key: e.target.value })}
                                                className="w-full bg-dark-card border border-dark-border rounded-lg px-3 py-1.5 text-[10px] font-mono text-emerald-400 outline-none focus:border-dark-accent"
                                            ></textarea>
                                            <button
                                                type="button"
                                                disabled={!uploadKeyData.name || !uploadKeyData.private_key}
                                                onClick={async () => {
                                                    try {
                                                        const res = await SSHKeyService.addManual(uploadKeyData.name, uploadKeyData.public_key || 'Manual-Provided', uploadKeyData.private_key);
                                                        queryClient.invalidateQueries(['ssh-keys']);
                                                        setSelectedKey(res.data.id);
                                                        setShowUploadKey(false);
                                                        setUploadKeyData({ name: '', public_key: '', private_key: '' });
                                                        toast.success('Key imported to vault!');
                                                    } catch (err) {
                                                        toast.error('Import failed');
                                                    }
                                                }}
                                                className="w-full py-2 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 text-[10px] font-bold uppercase rounded-lg transition-all"
                                            >
                                                Import to Vault
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Server Type</label>
                                <select name="type" className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-sm focus:border-dark-accent outline-none text-white transition-all">
                                    <option value="ubuntu">Ubuntu / Generic Linux</option>
                                    <option value="proxmox">Proxmox VE (API Token)</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-2.5 rounded-xl font-bold text-gray-400 hover:bg-dark-border transition-all">Cancel</button>
                                <button type="submit" className="flex-1 bg-dark-accent hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20">Add Server</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Servers;
