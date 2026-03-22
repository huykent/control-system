import React from 'react';

const Placeholder = ({ name }) => (
    <div className="p-12 bg-dark-card border border-dark-border rounded-2xl text-center italic text-gray-600">
        {name} content is being restored...
    </div>
);

export const Servers = () => <Placeholder name="Servers" />;
export const Terminal = () => <Placeholder name="Terminal" />;
export const DockerManager = () => <Placeholder name="Docker Manager" />;
export const ProxmoxManager = () => <Placeholder name="Proxmox Manager" />;
export const Discovery = () => <Placeholder name="Discovery" />;
export const SSHKeys = () => <Placeholder name="SSH Keys" />;
