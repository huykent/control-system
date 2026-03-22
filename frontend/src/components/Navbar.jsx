import React from 'react';
import { Search, User } from 'lucide-react';

const Navbar = () => {
    return (
        <header className="h-16 glass-navbar sticky top-0 z-10 flex items-center justify-between px-8">
            <div className="flex items-center gap-4 bg-white/[0.04] px-4 py-2 rounded-xl border border-white/[0.08] w-96 transition-all focus-within:border-blue-500/30 focus-within:bg-white/[0.06]">
                <Search size={16} className="text-gray-500" />
                <input
                    type="text"
                    placeholder="Search infrastructure..."
                    className="bg-transparent border-none outline-none text-sm w-full placeholder:text-gray-600 text-white"
                />
            </div>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 pl-6 border-l border-white/[0.06]">
                    <div className="text-right text-white">
                        <p className="text-sm font-medium">Administrator</p>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Local Network</p>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 ring-2 ring-blue-500/20">
                        <User size={18} className="text-white" />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
