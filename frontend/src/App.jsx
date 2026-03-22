/**
 * Author: Nguyễn Quang Huy 
 * facebook: https://www.facebook.com/QuangHuy.Nguyennn/
 */
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import MainLayout from './layouts/MainLayout';
import PageLoader from './components/PageLoader';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Servers = lazy(() => import('./pages/Servers'));
const Terminal = lazy(() => import('./pages/Terminal'));
const DockerManager = lazy(() => import('./pages/DockerManager'));
const ProxmoxManager = lazy(() => import('./pages/ProxmoxManager'));
const Discovery = lazy(() => import('./pages/Discovery'));
const SSHKeys = lazy(() => import('./pages/SSHKeys'));
const Settings = lazy(() => import('./pages/Settings'));

const queryClient = new QueryClient();

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <Toaster position="top-right" toastOptions={{ className: 'bg-dark-card text-white border border-dark-border shadow-2xl' }} />
                <Routes>
                    <Route path="/" element={<MainLayout />}>
                        <Route index element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
                        <Route path="servers" element={<Suspense fallback={<PageLoader />}><Servers /></Suspense>} />
                        <Route path="terminal/:serverId" element={<Suspense fallback={<PageLoader />}><Terminal /></Suspense>} />
                        <Route path="docker" element={<Suspense fallback={<PageLoader />}><DockerManager /></Suspense>} />
                        <Route path="proxmox" element={<Suspense fallback={<PageLoader />}><ProxmoxManager /></Suspense>} />
                        <Route path="keys" element={<Suspense fallback={<PageLoader />}><SSHKeys /></Suspense>} />
                        <Route path="discovery" element={<Suspense fallback={<PageLoader />}><Discovery /></Suspense>} />
                        <Route path="settings" element={<Suspense fallback={<PageLoader />}><Settings /></Suspense>} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </QueryClientProvider>
    );
}

export default App;

