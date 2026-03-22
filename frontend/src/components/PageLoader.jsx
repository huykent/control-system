import React from 'react';

const PageLoader = () => {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="flex justify-between items-end">
                <div>
                    <div className="h-8 w-64 bg-white/5 rounded-xl" />
                    <div className="h-4 w-96 bg-white/5 rounded-lg mt-3" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl h-28" />
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl h-80" />
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl h-80" />
            </div>
        </div>
    );
};

export default PageLoader;
