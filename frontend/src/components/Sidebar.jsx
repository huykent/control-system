import React from 'react';
import { LayoutDashboard, Server, Shield, Container, Network, Settings, Terminal as TerminalIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
    const menuItems = [
        { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
        { name: 'Servers', icon: <Server size={20} />, path: '/servers' },
        { name: 'Docker', icon: <Container size={20} />, path: '/docker' },
        { name: 'Proxmox', icon: <Network size={20} />, path: '/proxmox' },
        { name: 'SSH Keys', icon: <Shield size={20} />, path: '/keys' },
        { name: 'Discovery', icon: <Network size={20} />, path: '/discovery' },
        { name: 'Settings', icon: <Settings size={20} />, path: '/settings' },
    ];

    return (
        <aside className="w-64 glass-sidebar h-screen sticky top-0 flex flex-col">
            <div className="p-6 border-b border-white/[0.06] flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-500 to-cyan-400 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
                    <TerminalIcon size={22} className="text-white" />
                </div>
                <div>
                    <h1 className="font-bold text-lg tracking-tight text-white">LAN Control</h1>
                    <p className="text-[10px] text-gray-500 font-medium tracking-wider">INFRASTRUCTURE</p>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${isActive
                                ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/10 text-white border border-blue-500/20 glow-blue'
                                : 'hover:bg-white/[0.04] text-gray-400 hover:text-white border border-transparent'
                            }`
                        }
                    >
                        {item.icon}
                        <span className="font-medium text-sm">{item.name}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-white/[0.06]">
                <p className="text-[10px] text-gray-600 text-center font-mono">v1.0.0 • Optimized</p>
            </div>
        </aside>
    );
};

export default Sidebar;
