/**
 * Author: Nguyễn Quang Huy 
 * facebook: https://www.facebook.com/QuangHuy.Nguyennn/
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Container, Play, Square, RotateCcw, Trash2, Server, Search, Terminal as TerminalIcon, X } from 'lucide-react';
import { DockerService, ServerService } from '../services/api';
import toast from 'react-hot-toast';

const DockerManager = () => {
    const [selectedServer, setSelectedServer] = useState(null);
    const [logContainer, setLogContainer] = useState(null);
    const [confirmRemove, setConfirmRemove] = useState(null);
    const queryClient = useQueryClient();

    const { data: servers } = useQuery({
        queryKey: ['servers'],
        queryFn: () => ServerService.getAll().then(res => res.data)
    });

    const { data: containers, isLoading: isLoadingContainers } = useQuery({
        queryKey: ['containers', selectedServer?.id],
        queryFn: () => DockerService.getContainers(selectedServer.id).then(res => res.data),
        enabled: !!selectedServer
    });

    const { data: containerLogs, isLoading: isLoadingLogs } = useQuery({
        queryKey: ['logs', selectedServer?.id, logContainer?.container_id],
        queryFn: () => DockerService.getLogs(selectedServer.id, logContainer.container_id, 200).then(res => res.data),
        enabled: !!logContainer && !!selectedServer,
        refetchInterval: 5000 // auto refresh logs every 5s while modal is open
    });

    const startMutation = useMutation({
        mutationFn: (containerId) => DockerService.start(selectedServer.id, containerId),
        onSuccess: () => {
            queryClient.invalidateQueries(['containers', selectedServer?.id]);
            toast.success('Container started');
        },
        onError: (err) => toast.error(`Failed to start: ${err?.response?.data?.error || err.message}`)
    });

    const stopMutation = useMutation({
        mutationFn: (containerId) => DockerService.stop(selectedServer.id, containerId),
        onSuccess: () => {
            queryClient.invalidateQueries(['containers', selectedServer?.id]);
            toast.success('Container stopped');
        },
        onError: (err) => toast.error(`Failed to stop: ${err?.response?.data?.error || err.message}`)
    });

    const restartMutation = useMutation({
        mutationFn: (containerId) => DockerService.restart(selectedServer.id, containerId),
        onSuccess: () => {
            queryClient.invalidateQueries(['containers', selectedServer?.id]);
            toast.success('Container restarted');
        },
        onError: (err) => toast.error(`Failed to restart: ${err?.response?.data?.error || err.message}`)
    });

    const removeMutation = useMutation({
        mutationFn: (containerId) => DockerService.remove(selectedServer.id, containerId),
        onSuccess: () => {
            queryClient.invalidateQueries(['containers', selectedServer?.id]);
            toast.success('Container removed successfully');
        },
        onError: (err) => toast.error(`Failed to remove: ${err?.response?.data?.error || err.message}`)
    });

    const StatusBadge = ({ container }) => {
        const isRunning = container.status.toLowerCase().includes('up') || container.status.toLowerCase().includes('running');
        return (
            <div className="flex flex-col items-start gap-1">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${isRunning ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                    }`}>
                    {container.status}
                </span>
                {container.status_text && !isRunning && (
                    <span className="text-[9px] text-gray-500">{container.status_text}</span>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Docker Manager</h2>
                <p className="text-gray-500">Manage containers across your infrastructure.</p>
            </div>

            <div className="grid grid-cols-12 gap-8">
                <div className="col-span-12 lg:col-span-3 space-y-4">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-2">Available Hosts</h3>
                    <div className="space-y-2">
                        {servers?.map(server => (
                            <button
                                key={server.id}
                                onClick={() => { setSelectedServer(server); setLogContainer(null); }}
                                className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-3 ${selectedServer?.id === server.id
                                    ? 'bg-dark-accent/10 border-dark-accent text-white'
                                    : 'bg-dark-card border-dark-border text-gray-400 hover:border-gray-600'
                                    }`}
                            >
                                <Server size={18} />
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm truncate uppercase">{server.name}</p>
                                    <p className="text-[10px] opacity-70 font-mono italic">{server.ip}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="col-span-12 lg:col-span-9 bg-dark-card border border-dark-border rounded-2xl overflow-hidden min-h-[500px] flex flex-col relative">
                    {!selectedServer ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 italic p-20">
                            <Container size={60} className="mb-4 text-gray-700" />
                            <p>Select a server to view containers</p>
                        </div>
                    ) : (
                        <>
                            <div className="p-6 border-b border-dark-border bg-dark-bg/20 flex items-center justify-between">
                                <h3 className="font-bold text-lg text-white uppercase tracking-tighter">{selectedServer.name} Containers</h3>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-dark-bg/60">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-dark-border w-1/3">Name</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-dark-border">Image</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-dark-border">Status</th>
                                            <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-dark-border text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-dark-border/40">
                                        {containers?.map(container => (
                                            <tr key={container.container_id} className="hover:bg-dark-bg/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="text-white font-bold text-sm">{container.name}</p>
                                                    {container.error_detail && (
                                                        <p
                                                            className="text-[10px] text-red-400 mt-1 max-w-xs truncate cursor-pointer hover:text-red-300 hover:underline"
                                                            title="Click to view logs"
                                                            onClick={() => setLogContainer(container)}
                                                        >
                                                            Fault: {container.error_detail}
                                                        </p>
                                                    )}
                                                    {(container.restart_count > 0) && (
                                                        <p className="text-[10px] text-yellow-500 font-bold mt-0.5">
                                                            Restarts: {container.restart_count}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-xs font-mono text-gray-500">{container.image}</td>
                                                <td className="px-6 py-4"><StatusBadge container={container} /></td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => setLogContainer(container)}
                                                            title="View Logs"
                                                            className="p-1 px-3 bg-dark-bg hover:bg-dark-accent/20 text-blue-400 rounded border border-dark-border transition-colors">
                                                            <TerminalIcon size={12} fill="none" />
                                                        </button>
                                                        <button
                                                            onClick={() => startMutation.mutate(container.container_id)}
                                                            title="Start"
                                                            className="p-1 px-3 bg-dark-bg hover:bg-green-500 text-white rounded border border-dark-border transition-colors">
                                                            <Play size={12} fill="currentColor" />
                                                        </button>
                                                        <button
                                                            onClick={() => restartMutation.mutate(container.container_id)}
                                                            title="Restart"
                                                            className="p-1 px-3 bg-dark-bg hover:bg-orange-500 text-white rounded border border-dark-border transition-colors">
                                                            <RotateCcw size={12} />
                                                        </button>
                                                        <button
                                                            onClick={() => stopMutation.mutate(container.container_id)}
                                                            title="Stop"
                                                            className="p-1 px-3 bg-dark-bg hover:bg-red-500 text-white rounded border border-dark-border transition-colors">
                                                            <Square size={12} fill="currentColor" />
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmRemove(container)}
                                                            title="Remove Container"
                                                            className="p-1 px-3 bg-dark-bg hover:bg-red-600 text-white rounded border border-dark-border transition-colors ml-2">
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {/* Logs Modal Overlay */}
                    {logContainer && (
                        <div className="absolute inset-0 z-10 bg-dark-bg/95 flex flex-col animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between p-4 border-b border-dark-border backdrop-blur-md bg-dark-card/50">
                                <div>
                                    <h3 className="font-bold text-white uppercase text-sm flex items-center gap-2">
                                        <TerminalIcon size={14} className="text-dark-accent" />
                                        {logContainer.name} Logs
                                    </h3>
                                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">{logContainer.container_id}</p>
                                </div>
                                <button
                                    onClick={() => setLogContainer(null)}
                                    className="p-2 hover:bg-dark-border rounded-lg text-gray-400 hover:text-white transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="flex-1 p-4 overflow-hidden relative">
                                {isLoadingLogs ? (
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm font-mono animate-pulse">
                                        Loading logs...
                                    </div>
                                ) : (
                                    <div className="bg-black/50 border border-dark-border rounded-lg h-full overflow-y-auto p-4 font-mono text-[11px] text-gray-300 whitespace-pre-wrap">
                                        {containerLogs || 'No logs available.'}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Delete Confirmation Modal */}
                    {confirmRemove && (
                        <div className="absolute inset-0 z-20 bg-dark-bg/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in zoom-in-95 duration-200 p-4">
                            <div className="bg-dark-card border border-red-500/50 shadow-2xl shadow-red-500/10 rounded-2xl w-full max-w-md overflow-hidden">
                                <div className="p-6 border-b border-dark-border">
                                    <h3 className="text-xl font-bold text-red-500 flex items-center gap-2">
                                        <Trash2 size={20} />
                                        Deep Remove Container
                                    </h3>
                                </div>
                                <div className="p-6 space-y-4">
                                    <p className="text-gray-300">
                                        Are you absolute sure you want to deep remove <strong>{confirmRemove.name}</strong>?
                                    </p>
                                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm">
                                        <ul className="list-disc list-inside space-y-1 ml-2">
                                            <li>Force stops the container if it's running.</li>
                                            <li>Deletes all associated anonymous volumes.</li>
                                            <li>Attempts to delete the base Docker Image entirely.</li>
                                        </ul>
                                    </div>
                                </div>
                                <div className="p-4 bg-dark-bg flex items-center justify-end gap-3 border-t border-dark-border">
                                    <button
                                        onClick={() => setConfirmRemove(null)}
                                        className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            removeMutation.mutate(confirmRemove.container_id);
                                            setConfirmRemove(null);
                                        }}
                                        className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        Yes, Deep Wipe
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DockerManager;
