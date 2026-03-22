/**
 * Author: Nguyễn Quang Huy 
 * facebook: https://www.facebook.com/QuangHuy.Nguyennn/
 */
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { io } from 'socket.io-client';
import { ChevronLeft, Maximize2, Terminal as TerminalIcon, Power } from 'lucide-react';
import { ServerService } from '../services/api';

const Terminal = () => {
    const { serverId } = useParams();
    const navigate = useNavigate();
    const terminalRef = useRef(null);
    const xtermRef = useRef(null);
    const socketRef = useRef(null);
    const [server, setServer] = useState(null);

    useEffect(() => {
        ServerService.getOne(serverId).then(res => {
            if (res.success) setServer(res.data);
        });

        const term = new XTerm({
            cursorBlink: true,
            theme: {
                background: '#111827',
                foreground: '#f3f4f6',
                cursor: '#3b82f6',
                selection: '#3b82f640'
            },
            fontSize: 14,
            fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);

        term.open(terminalRef.current);
        fitAddon.fit();
        xtermRef.current = term;

        const getSocketUrl = () => {
            if (import.meta.env.VITE_API_BASE_URL) {
                return import.meta.env.VITE_API_BASE_URL.replace('/api', '/terminal');
            }
            return window.location.port === '5173' ? 'http://localhost:3000/terminal' : '/terminal';
        };
        const socket = io(getSocketUrl());
        socketRef.current = socket;

        socket.on('connect', () => {
            term.writeln('\x1b[32m[SYSTEM] Connected to terminal proxy...\x1b[0m');
            socket.emit('terminal:start', { serverId, cols: term.cols, rows: term.rows });
        });

        socket.on('terminal:data', (data) => {
            term.write(data);
        });

        socket.on('terminal:error', (error) => {
            term.writeln(`\x1b[31m[ERROR] ${error}\x1b[0m`);
        });

        term.onData((data) => {
            socket.emit('terminal:input', data);
        });

        const handleResize = () => {
            fitAddon.fit();
            socket.emit('terminal:resize', { cols: term.cols, rows: term.rows });
        };

        window.addEventListener('resize', handleResize);

        return () => {
            socket.disconnect();
            term.dispose();
            window.removeEventListener('resize', handleResize);
        };
    }, [serverId]);

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col bg-dark-bg animate-in zoom-in-95 duration-500">
            <div className="flex items-center justify-between mb-4 bg-dark-card border border-dark-border p-4 rounded-xl shadow-lg">
                <div className="flex items-center gap-4 text-white">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-dark-border rounded-lg text-gray-500 hover:text-white transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="bg-dark-accent p-2 rounded-lg">
                            <TerminalIcon size={18} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm tracking-tight">{server?.name || 'Loading...'}</h3>
                            <p className="text-[10px] text-gray-500 font-mono tracking-tighter uppercase">{server?.ip}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all rounded-lg text-xs font-bold border border-red-500/20">
                        <Power size={14} />
                        Terminate
                    </button>
                </div>
            </div>

            <div className="flex-1 bg-dark-card border border-dark-border p-4 rounded-2xl shadow-inner relative overflow-hidden group">
                <div ref={terminalRef} className="h-full w-full"></div>
            </div>
        </div>
    );
};

export default Terminal;
