/**
 * Author: Nguyễn Quang Huy 
 * facebook: https://www.facebook.com/QuangHuy.Nguyennn/
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Network, Server, Cloud, AlertTriangle, Play, Square, RotateCcw } from 'lucide-react';
import { ProxmoxService, ServerService } from '../services/api';

const ProxmoxManager = () => {
    const [selectedServer, setSelectedServer] = useState(null);
    const [selectedNode, setSelectedNode] = useState(null);
    const queryClient = useQueryClient();

    const { data: servers } = useQuery({
        queryKey: ['servers'],
        queryFn: () => ServerService.getAll().then(res => res.data.filter(s => s.type === 'proxmox'))
    });

    const { data: nodes } = useQuery({
        queryKey: ['proxmox-nodes', selectedServer?.id],
        queryFn: () => ProxmoxService.getNodes(selectedServer.id).then(res => res.data),
        enabled: !!selectedServer
    });

    const { data: vms } = useQuery({
        queryKey: ['proxmox-vms', selectedServer?.id, selectedNode?.node],
        queryFn: () => ProxmoxService.getVMs(selectedServer.id, selectedNode.node).then(res => res.data),
        enabled: !!selectedServer && !!selectedNode
    });

    const vmMutation = useMutation({
        mutationFn: (data) => ProxmoxService.controlVM({ ...data, serverId: selectedServer.id, node: selectedNode.node }),
        onSuccess: () => queryClient.invalidateQueries(['proxmox-vms', selectedServer?.id, selectedNode?.node])
    });

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-white mb-2 underline decoration-dark-accent underline-offset-8 decoration-4">Proxmox VE</h2>
                <p className="text-gray-500 mt-4 italic">Virtual Environment orchestration.</p>
            </div>

            <div className="grid grid-cols-12 gap-8">
                <div className="col-span-12 lg:col-span-3 space-y-6">
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Clusters</h3>
                    <div className="space-y-2">
                        {servers?.map(server => (
                            <button
                                key={server.id}
                                onClick={() => { setSelectedServer(server); setSelectedNode(null); }}
                                className={`w-full text-left p-3 rounded-lg border transition-all ${selectedServer?.id === server.id
                                    ? 'bg-dark-accent/20 border-dark-accent text-white'
                                    : 'bg-dark-card border-dark-border text-gray-400 hover:border-gray-600'
                                    }`}
                            >
                                <p className="font-bold text-xs uppercase">{server.name}</p>
                            </button>
                        ))}
                    </div>

                    {selectedServer && (
                        <div className="space-y-2">
                            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Nodes</h3>
                            {nodes?.map(node => (
                                <button
                                    key={node.node}
                                    onClick={() => setSelectedNode(node)}
                                    className={`w-full text-left p-3 rounded-lg border transition-all ${selectedNode?.node === node.node
                                        ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                                        : 'bg-dark-card border-dark-border text-gray-400 hover:border-gray-600'
                                        }`}
                                >
                                    <p className="font-bold text-xs uppercase">{node.node}</p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="col-span-12 lg:col-span-9">
                    {!selectedNode ? (
                        <div className="h-full bg-dark-card border border-dark-border rounded-2xl flex flex-col items-center justify-center p-20 text-gray-600 border-dashed">
                            <AlertTriangle size={32} className="mb-4" />
                            <p className="font-bold uppercase tracking-tight">Select a node</p>
                        </div>
                    ) : (
                        <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden shadow-2xl">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-dark-bg/60">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase border-b border-dark-border">VMID</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase border-b border-dark-border">Name</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase border-b border-dark-border text-center">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase border-b border-dark-border text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-dark-border/30">
                                    {vms?.map(vm => (
                                        <tr key={vm.vmid} className="hover:bg-dark-accent/5">
                                            <td className="px-6 py-4 text-xs font-mono text-dark-accent">{vm.vmid}</td>
                                            <td className="px-6 py-4 font-bold text-sm text-white">{vm.name || 'unnamed'}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${vm.status === 'running' ? 'bg-green-500 text-white' : 'bg-red-500/20 text-red-500'
                                                    }`}>
                                                    {vm.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => vmMutation.mutate({ type: vm.type, vmid: vm.vmid, action: 'start' })} className="p-1 px-3 bg-dark-bg hover:bg-emerald-500 text-white rounded border border-dark-border"><Play size={10} fill="currentColor" /></button>
                                                    <button onClick={() => vmMutation.mutate({ type: vm.type, vmid: vm.vmid, action: 'stop' })} className="p-1 px-3 bg-dark-bg hover:bg-red-500 text-white rounded border border-dark-border"><Square size={10} fill="currentColor" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProxmoxManager;
