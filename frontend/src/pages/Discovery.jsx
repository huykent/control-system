/**
 * Author: Nguyễn Quang Huy 
 * facebook: https://www.facebook.com/QuangHuy.Nguyennn/
 */
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DiscoveryService, ServerService, SSHKeyService } from '../services/api';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import { Radar, RefreshCw, Server, Plus, Globe, Shield, User, HardDrive, Upload } from 'lucide-react';

const Discovery = () => {
    const [isScanning, setIsScanning] = useState(false);
    const [selectedHost, setSelectedHost] = useState(null);
    const queryClient = useQueryClient();

    const { data: discovered, refetch } = useQuery({
        queryKey: ['discovered'],
        queryFn: () => DiscoveryService.getDiscovered().then(res => res.data)
    });

    const { data: keys } = useQuery({
        queryKey: ['ssh-keys'],
        queryFn: () => SSHKeyService.getAll().then(res => res.data)
    });

    const [authType, setAuthType] = useState('password');
    const [selectedKey, setSelectedKey] = useState('');
    const [showUploadKey, setShowUploadKey] = useState(false);
    const [uploadKeyData, setUploadKeyData] = useState({ name: '', public_key: '', private_key: '' });

    useEffect(() => {
        const socket = io('http://localhost:3000');

        socket.on('discovery:host_updated', (updatedHost) => {
            queryClient.setQueryData(['discovered'], (old) => {
                if (!old) return old;
                return old.map(h => h.ip === updatedHost.ip ? { ...h, vendor: updatedHost.vendor } : h);
            });
        });

        socket.on('discovery:done', () => {
            setIsScanning(false);
        });

        return () => socket.disconnect();
    }, [queryClient]);

    const handleScan = async () => {
        setIsScanning(true);
        queryClient.setQueryData(['discovered'], []); // Optional: clear list to show fresh scan
        try {
            await DiscoveryService.scan();
            refetch(); // This will load the immediate "Unknown" hosts
        } catch (e) {
            setIsScanning(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-center">
                <div className="text-white">
                    <h2 className="text-3xl font-bold tracking-tight">Network Discovery</h2>
                    <p className="text-gray-500">Scan and identify infrastructure nodes in your local area network.</p>
                </div>
                <button
                    onClick={handleScan}
                    disabled={isScanning}
                    className={`flex items-center gap-3 px-8 py-3 rounded-xl font-bold transition-all shadow-lg ${isScanning
                        ? 'bg-dark-border text-gray-500 cursor-not-allowed'
                        : 'bg-dark-accent hover:bg-blue-600 text-white shadow-blue-500/20'
                        }`}
                >
                    {isScanning ? <RefreshCw size={20} className="animate-spin" /> : <Radar size={20} />}
                    {isScanning ? 'Scanning...' : 'Start Scan'}
                </button>
            </div>

            <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden min-h-[400px]">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-dark-bg/60">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase border-b border-dark-border">Host</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase border-b border-dark-border">MAC Address</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase border-b border-dark-border">Vendor</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase border-b border-dark-border text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-border/40">
                        {discovered?.map(host => (
                            <tr key={host.ip} className="hover:bg-dark-accent/5 transition-colors">
                                <td className="px-6 py-4">
                                    <div>
                                        <p className="text-white font-bold text-sm tracking-tight">{host.ip}</p>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-xs font-mono text-gray-400 uppercase tracking-widest">{host.mac}</td>
                                <td className="px-6 py-4 font-bold text-xs uppercase text-gray-500 tracking-tighter">{host.vendor || 'Unknown'}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end">
                                        <button
                                            onClick={() => setSelectedHost(host)}
                                            className="px-4 py-1.5 bg-dark-bg hover:bg-dark-accent text-white text-xs font-bold rounded-lg border border-dark-border transition-all">
                                            Admit
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selectedHost && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-dark-card border border-dark-border rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-dark-border bg-dark-bg/30">
                            <h3 className="text-xl font-bold text-white">Add Discovered Server</h3>
                            <p className="text-gray-500 text-xs mt-1">Configure {selectedHost.ip} for management.</p>
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
                                setSelectedHost(null);
                                setAuthType('password');
                                setSelectedKey('');
                                toast.success('Host added successfully!');
                            }).catch(err => {
                                toast.error(`Failed to add host: ${err.message}`);
                            });
                        }}>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Server Name</label>
                                <input name="name" type="text" required defaultValue={selectedHost.vendor || 'New Host'} className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-sm focus:border-dark-accent outline-none text-white transition-all shadow-inner" />
                            </div>

                            <input name="ip" type="hidden" value={selectedHost.ip} />

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Username</label>
                                    <input name="username" type="text" required defaultValue="root" className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-sm focus:border-dark-accent outline-none text-white transition-all" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Auth Type</label>
                                    <select
                                        name="auth_type"
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
                                                placeholder="Paste PRIVATE key here (Required)..."
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
                                    <option value="proxmox">Proxmox VE</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-6">
                                <button type="button" onClick={() => setSelectedHost(null)} className="flex-1 px-6 py-2.5 rounded-xl font-bold text-gray-400 hover:bg-dark-border transition-all">Cancel</button>
                                <button type="submit" className="flex-1 bg-dark-accent hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20">Add Server</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Discovery;
