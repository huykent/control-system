import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Key, Shield, Hash, Clock, ShieldAlert, Download, Server, Send, ShieldCheck, ShieldX, Zap, RefreshCw } from 'lucide-react';
import { SSHKeyService, ServerService } from '../services/api';
import toast from 'react-hot-toast';

const SSHKeys = () => {
    const queryClient = useQueryClient();
    const [isGenerating, setIsGenerating] = useState(false);
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [newKeyType, setNewKeyType] = useState('ed25519');
    const [confirmDeleteKey, setConfirmDeleteKey] = useState(null);
    const [pushKeyTo, setPushKeyTo] = useState(null);
    const [selectedServerToPush, setSelectedServerToPush] = useState('');
    const [serverSshStatus, setServerSshStatus] = useState(null);
    const [isAuditing, setIsAuditing] = useState(false);

    React.useEffect(() => {
        if (selectedServerToPush && pushKeyTo) {
            handleAuditServer(selectedServerToPush);
        } else {
            setServerSshStatus(null);
        }
    }, [selectedServerToPush, pushKeyTo]);

    const { data: keys, isLoading } = useQuery({
        queryKey: ['ssh-keys'],
        queryFn: () => SSHKeyService.getAll().then(res => res.data)
    });

    const generateMutation = useMutation({
        mutationFn: ({ name, type }) => SSHKeyService.generate(name, type),
        onMutate: () => setIsGenerating(true),
        onSettled: () => setIsGenerating(false),
        onSuccess: () => queryClient.invalidateQueries(['ssh-keys']),
        onError: (err) => toast.error(`Failed to generate key: ${err?.response?.data?.error || err.message}`)
    });

    const { data: servers } = useQuery({
        queryKey: ['servers'],
        queryFn: () => ServerService.getAll().then(res => res.data)
    });

    const pushMutation = useMutation({
        mutationFn: ({ keyId, serverId }) => SSHKeyService.pushToServer(keyId, serverId),
        onSuccess: () => {
            toast.success('Key pushed securely to server!');
            handleAuditServer(selectedServerToPush); // Refresh audit after push
        },
        onError: (err) => toast.error(`Failed to push key: ${err?.response?.data?.error || err.message}\nDetails: ${err?.response?.data?.details || ''}`)
    });

    const configureSshdMutation = useMutation({
        mutationFn: (serverId) => SSHKeyService.configureSshd(serverId),
        onSuccess: () => {
            toast.success('SSHD configured and service restarted!');
            handleAuditServer(selectedServerToPush); // Refresh audit
        },
        onError: (err) => toast.error(`Failed to configure SSHD: ${err?.response?.data?.error || err.message}`)
    });

    const handleAuditServer = async (serverId) => {
        if (!serverId) return;
        setIsAuditing(true);
        try {
            const status = await SSHKeyService.getServerStatus(serverId);
            setServerSshStatus(status.data);
        } catch (err) {
            toast.error('Failed to audit server SSH status');
            setServerSshStatus(null);
        } finally {
            setIsAuditing(false);
        }
    };

    const deleteMutation = useMutation({
        mutationFn: (id) => SSHKeyService.delete(id),
        onSuccess: () => queryClient.invalidateQueries(['ssh-keys']),
        onError: (err) => toast.error(`Failed to delete key: ${err?.response?.data?.error || err.message}`)
    });

    const handleGenerateConfirm = () => {
        if (newKeyName && newKeyName.trim()) {
            generateMutation.mutate({ name: newKeyName.trim(), type: newKeyType });
            setShowGenerateModal(false);
            setNewKeyName('');
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('Public key copied to clipboard!');
    };

    const hasKeys = keys && keys.length > 0;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white mb-2">SSH Key Management</h2>
                    <p className="text-gray-500">Securely store and manage your cryptographic identities.</p>
                </div>
                <button
                    onClick={() => setShowGenerateModal(true)}
                    disabled={isGenerating}
                    className="bg-dark-accent hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50">
                    <Plus size={20} />
                    {isGenerating ? 'Generating...' : 'Generate New Key'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-dark-card border border-dark-border rounded-2xl p-8 flex flex-col items-center justify-center text-gray-500 min-h-[300px] border-dashed">
                    <div className="bg-dark-bg p-6 rounded-3xl mb-6 shadow-xl">
                        <Key size={48} className="text-dark-accent opacity-50" />
                    </div>
                    <p className="font-bold text-lg mb-2">Internal Vault</p>
                    <p className="text-sm max-w-xs text-center leading-relaxed">Cryptographic keys are generated internally. Use the public key to authorize connections on your target servers.</p>
                </div>

                <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden shadow-2xl flex flex-col h-full max-h-[500px]">
                    <div className="p-6 border-b border-dark-border bg-dark-bg/30">
                        <h3 className="font-bold text-lg flex items-center gap-3">
                            <Shield size={20} className="text-emerald-500" /> Authorized Keys
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-0">
                        {isLoading ? (
                            <div className="p-10 flex text-gray-500 justify-center">Loading keys...</div>
                        ) : !hasKeys ? (
                            <div className="p-10 flex flex-col items-center justify-center text-gray-600 italic h-full">
                                <ShieldAlert size={32} className="mb-4 opacity-30" />
                                <p className="text-sm text-center">No keys registered in global vault.</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-dark-border">
                                {keys.map(key => (
                                    <li key={key.id} className="p-6 hover:bg-dark-bg/50 transition-colors">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="text-white font-bold tracking-tight mb-1">{key.name}</h4>
                                                <div className="flex items-center gap-4 text-xs font-mono text-gray-500">
                                                    <span className="flex items-center gap-1"><Hash size={12} /> ID: {key.id}</span>
                                                    <span className="flex items-center gap-1"><Clock size={12} /> {new Date(key.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        setPushKeyTo(key);
                                                        if (servers?.length > 0) setSelectedServerToPush(servers[0].id);
                                                    }}
                                                    title="Push Key to Server"
                                                    className="p-2 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors">
                                                    <Send size={16} />
                                                </button>
                                                <a
                                                    href={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/ssh-keys/${key.id}/download`}
                                                    download
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    title="Download Private Key (.pem)"
                                                    className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors">
                                                    <Download size={16} />
                                                </a>
                                                <button
                                                    onClick={() => setConfirmDeleteKey(key)}
                                                    title="Delete Key"
                                                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="bg-dark-bg p-3 rounded-lg flex flex-col gap-2">
                                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Public Key</span>
                                            <div className="flex items-center gap-2">
                                                <code className="text-xs text-blue-400 truncate flex-1 block">
                                                    {key.public_key}
                                                </code>
                                                <button
                                                    onClick={() => copyToClipboard(key.public_key)}
                                                    className="text-[10px] font-bold px-2 py-1 bg-dark-card border border-dark-border rounded hover:bg-dark-accent hover:text-white transition-colors"
                                                >
                                                    Copy
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>

            {/* Generate Key Modal */}
            {showGenerateModal && (
                <div className="absolute inset-0 z-50 bg-dark-bg/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in zoom-in-95 duration-200 p-4">
                    <div className="bg-dark-card border border-dark-border shadow-2xl rounded-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-dark-border bg-dark-bg/50">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Key size={20} className="text-dark-accent" />
                                Generate New SSH Key
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-gray-400">
                                This will generate a new ED25519 cryptographic key pair. Provide a friendly name to identify it in the vault.
                            </p>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Key Name</label>
                                <input
                                    type="text"
                                    value={newKeyName}
                                    onChange={(e) => setNewKeyName(e.target.value)}
                                    placeholder="e.g. Production Web Servers"
                                    className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-dark-accent transition-colors"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleGenerateConfirm();
                                        if (e.key === 'Escape') setShowGenerateModal(false);
                                    }}
                                />
                            </div>
                            <div className="mt-4">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Key Type / Algorithm</label>
                                <select
                                    value={newKeyType}
                                    onChange={(e) => setNewKeyType(e.target.value)}
                                    className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-dark-accent transition-colors"
                                >
                                    <option value="ed25519">ED25519 (Modern, Fast, Secure)</option>
                                    <option value="rsa">RSA 4096-bit (Legacy, Maximum Compatibility for Bitvise)</option>
                                </select>
                            </div>
                        </div>
                        <div className="p-4 bg-dark-bg flex items-center justify-end gap-3 border-t border-dark-border">
                            <button
                                onClick={() => {
                                    setShowGenerateModal(false);
                                    setNewKeyName('');
                                }}
                                className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleGenerateConfirm}
                                disabled={!newKeyName.trim() || isGenerating}
                                className="px-6 py-2 bg-dark-accent hover:bg-blue-600 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGenerating ? 'Generating...' : 'Generate Key'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {confirmDeleteKey && (
                <div className="absolute inset-0 z-50 bg-dark-bg/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in zoom-in-95 duration-200 p-4">
                    <div className="bg-dark-card border border-red-500/50 shadow-2xl shadow-red-500/10 rounded-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-dark-border">
                            <h3 className="text-xl font-bold text-red-500 flex items-center gap-2">
                                <Trash2 size={20} />
                                Delete SSH Key
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-gray-300">
                                Are you absolute sure you want to permanently delete the SSH key <strong>{confirmDeleteKey.name}</strong>?
                            </p>
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm">
                                <ul className="list-disc list-inside space-y-1 ml-2">
                                    <li>Servers using this key will immediately lose access.</li>
                                    <li>This cryptographic material cannot be recovered.</li>
                                </ul>
                            </div>
                        </div>
                        <div className="p-4 bg-dark-bg flex items-center justify-end gap-3 border-t border-dark-border">
                            <button
                                onClick={() => setConfirmDeleteKey(null)}
                                className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    deleteMutation.mutate(confirmDeleteKey.id);
                                    setConfirmDeleteKey(null);
                                }}
                                className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
                            >
                                Yes, Delete Key
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Push Key Modal */}
            {pushKeyTo && (
                <div className="absolute inset-0 z-50 bg-dark-bg/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in zoom-in-95 duration-200 p-4">
                    <div className="bg-dark-card border border-emerald-500/30 shadow-2xl shadow-emerald-500/10 rounded-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-dark-border">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Send size={20} className="text-emerald-500" />
                                Push SSH Key
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-gray-300">
                                Deploy <strong>{pushKeyTo.name}</strong> directly to a server's <code className="text-xs text-gray-500 bg-dark-bg p-1 rounded">authorized_keys</code> to grant access instantly.
                            </p>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Select Destination Server</label>
                                <select
                                    value={selectedServerToPush}
                                    onChange={(e) => setSelectedServerToPush(e.target.value)}
                                    className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                >
                                    {servers?.map(srv => (
                                        <option key={srv.id} value={srv.id}>{srv.name} ({srv.ip})</option>
                                    ))}
                                    {!servers?.length && <option disabled>No servers available</option>}
                                </select>
                            </div>

                            {/* Audit Section */}
                            <div className="bg-dark-bg/50 border border-dark-border rounded-xl p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                        <Shield size={12} />
                                        Server SSH Audit
                                    </h4>
                                    {isAuditing && <RefreshCw size={12} className="text-dark-accent animate-spin" />}
                                </div>

                                {serverSshStatus ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-gray-400">Password Login:</span>
                                            {serverSshStatus.passwordAuth ? (
                                                <span className="text-emerald-500 flex items-center gap-1 font-bold"><ShieldCheck size={12} /> Enabled</span>
                                            ) : (
                                                <span className="text-red-500 flex items-center gap-1 font-bold"><ShieldX size={12} /> Disabled</span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-gray-400">Public Key Login:</span>
                                            {serverSshStatus.pubkeyAuth ? (
                                                <span className="text-emerald-500 flex items-center gap-1 font-bold"><ShieldCheck size={12} /> Enabled</span>
                                            ) : (
                                                <span className="text-red-500 flex items-center gap-1 font-bold"><ShieldX size={12} /> Disabled</span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-gray-400">Key Already Present:</span>
                                            {serverSshStatus.authorizedKeys.includes(pushKeyTo.public_key) ? (
                                                <span className="text-emerald-500 flex items-center gap-1 font-bold"><ShieldCheck size={12} /> Yes</span>
                                            ) : (
                                                <span className="text-gray-500 flex items-center gap-1 font-bold">No</span>
                                            )}
                                        </div>

                                        {(!serverSshStatus.passwordAuth || !serverSshStatus.pubkeyAuth) && (
                                            <button
                                                onClick={() => configureSshdMutation.mutate(selectedServerToPush)}
                                                disabled={configureSshdMutation.isPending}
                                                className="w-full mt-2 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-[10px] font-bold uppercase rounded-lg border border-blue-500/30 flex items-center justify-center gap-2 transition-all"
                                            >
                                                <Zap size={12} className="fill-current" />
                                                {configureSshdMutation.isPending ? 'Configuring...' : 'Quick Fix & Enable SSH Login'}
                                            </button>
                                        )}
                                    </div>
                                ) : !isAuditing && (
                                    <p className="text-[10px] text-gray-600 italic">Select a server to start audit.</p>
                                )}
                            </div>
                        </div>
                        <div className="p-4 bg-dark-bg flex items-center justify-end gap-3 border-t border-dark-border">
                            <button
                                onClick={() => setPushKeyTo(null)}
                                className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => pushMutation.mutate({ keyId: pushKeyTo.id, serverId: selectedServerToPush })}
                                disabled={!selectedServerToPush || pushMutation.isPending}
                                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {pushMutation.isPending ? 'Pushing...' : 'Deploy Key'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SSHKeys;
