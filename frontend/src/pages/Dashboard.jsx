import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Server, Activity, Container, ShieldCheck, AlertTriangle, FileText, XCircle, X } from 'lucide-react';
import { DashboardService, SystemLogService } from '../services/api';

const Dashboard = () => {
    const [stats, setStats] = useState({
        servers: 0,
        containers: 0,
        health: '100%',
        uptime: 'Loading...',
        history: []
    });
    const [logs, setLogs] = useState([]);
    const [errors, setErrors] = useState([]);
    const [isLogsOpen, setIsLogsOpen] = useState(false);

    useEffect(() => {
        DashboardService.getSummary().then(res => {
            if (res.success) {
                setStats(res.data);
            }
        });

        const fetchLogs = () => {
            SystemLogService.getRecent().then(res => {
                if (res.success) setLogs(res.data);
            });
            SystemLogService.getRecentErrors(15).then(res => {
                if (res.success) setErrors(res.data);
            });
        };

        fetchLogs();
        const logSec = setInterval(fetchLogs, 15000);
        return () => clearInterval(logSec);
    }, []);

    const StatCard = ({ title, value, icon, color }) => (
        <div className="glass-card-hover p-6 flex items-center gap-4 group">
            <div className={`${color} p-3.5 rounded-xl text-white shadow-lg`}>
                {icon}
            </div>
            <div>
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{title}</p>
                <p className="text-2xl font-bold mt-1 tracking-tight group-hover:text-blue-400 transition-colors">{value}</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-end text-white">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Infrastructure Overview</h2>
                    <p className="text-gray-500 mt-1">Real-time health and performance status of your local network.</p>
                </div>
                <button
                    onClick={() => setIsLogsOpen(true)}
                    className="flex items-center gap-2 bg-dark-card hover:bg-dark-border border border-dark-border text-white px-4 py-2 rounded-xl transition-all active:scale-95 text-sm font-bold"
                >
                    <FileText size={16} className="text-gray-400" />
                    System Logs
                </button>
            </div>

            {errors.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start gap-4">
                    <div className="bg-red-500/20 p-2 rounded-lg mt-1">
                        <AlertTriangle className="text-red-500" size={20} />
                    </div>
                    <div>
                        <h3 className="text-red-500 font-bold mb-1">System Alerts Detected</h3>
                        <p className="text-gray-400 text-sm">There are {errors.length} active errors or offline alerts in the last 15 minutes. Check the System Logs for details.</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Servers" value={stats.servers} icon={<Server size={20} />} color="bg-gradient-to-br from-blue-500 to-blue-600" />
                <StatCard title="Docker Items" value={stats.containers} icon={<Container size={20} />} color="bg-gradient-to-br from-cyan-500 to-cyan-600" />
                <StatCard title="Overall Health" value={stats.health} icon={<Activity size={20} />} color="bg-gradient-to-br from-emerald-500 to-emerald-600" />
                <StatCard title="System Uptime" value={stats.uptime} icon={<ShieldCheck size={20} />} color="bg-gradient-to-br from-indigo-500 to-indigo-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-6 flex flex-col h-[400px]">
                    <h3 className="font-bold text-lg text-white mb-6">CPU Load History</h3>
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.history || []}>
                                <defs>
                                    <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '12px', color: '#f3f4f6' }}
                                    itemStyle={{ color: '#3b82f6' }}
                                />
                                <Area type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCpu)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-card p-6 flex flex-col h-[400px]">
                    <h3 className="font-bold text-lg text-white mb-6">Memory Usage History</h3>
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.history || []}>
                                <defs>
                                    <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '12px', color: '#f3f4f6' }}
                                    itemStyle={{ color: '#10b981' }}
                                />
                                <Area type="monotone" dataKey="ram" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRam)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {isLogsOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-dark-card border border-dark-border rounded-3xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-dark-border bg-dark-bg/30 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <FileText size={20} className="text-gray-400" />
                                    System Logs
                                </h3>
                                <p className="text-gray-500 text-sm mt-1">Real-time diagnostics and error tracking.</p>
                            </div>
                            <button onClick={() => setIsLogsOpen(false)} className="p-2 hover:bg-dark-border rounded-xl text-gray-500 hover:text-white transition-all hidden md:block">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-0 bg-[#0A0A0A]">
                            {logs.length === 0 ? (
                                <div className="p-12 text-center text-gray-500">
                                    <p className="font-bold text-lg">No logs available.</p>
                                </div>
                            ) : (
                                <table className="w-full text-left text-sm text-gray-400">
                                    <thead className="bg-dark-bg/50 border-b border-dark-border sticky top-0 backdrop-blur-md">
                                        <tr>
                                            <th className="p-4 font-bold text-gray-300 w-48">Timestamp</th>
                                            <th className="p-4 font-bold text-gray-300 w-24">Level</th>
                                            <th className="p-4 font-bold text-gray-300 w-48">Source</th>
                                            <th className="p-4 font-bold text-gray-300">Message</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-dark-border/50">
                                        {logs.map((log) => (
                                            <tr key={log.id} className="hover:bg-dark-bg/30 transition-colors">
                                                <td className="p-4 font-mono text-[11px] whitespace-nowrap">{new Date(log.timestamp + 'Z').toLocaleString()}</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${log.level === 'error' ? 'bg-red-500/10 text-red-500' :
                                                        log.level === 'warning' ? 'bg-yellow-500/10 text-yellow-500' :
                                                            'bg-blue-500/10 text-blue-500'
                                                        }`}>
                                                        {log.level}
                                                    </span>
                                                </td>
                                                <td className="p-4 font-mono text-xs">{log.source}</td>
                                                <td className="p-4 text-gray-300 break-words">{log.message}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        <div className="p-4 border-t border-dark-border bg-dark-bg/30 flex justify-end md:hidden">
                            <button onClick={() => setIsLogsOpen(false)} className="bg-dark-border text-white px-6 py-2 rounded-xl font-bold w-full">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
