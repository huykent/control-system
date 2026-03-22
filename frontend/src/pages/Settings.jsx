import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, BellDot } from 'lucide-react';
import { SettingsService } from '../services/api';
import toast from 'react-hot-toast';

const Settings = () => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        TELEGRAM_BOT_TOKEN: '',
        TELEGRAM_CHAT_ID: ''
    });

    const { data: settings, isLoading } = useQuery({
        queryKey: ['settings'],
        queryFn: () => SettingsService.getSettings().then(res => res.data)
    });

    useEffect(() => {
        if (settings) {
            setFormData({
                TELEGRAM_BOT_TOKEN: settings.TELEGRAM_BOT_TOKEN || '',
                TELEGRAM_CHAT_ID: settings.TELEGRAM_CHAT_ID || ''
            });
        }
    }, [settings]);

    const mutation = useMutation({
        mutationFn: (data) => SettingsService.updateSettings(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['settings']);
            toast.success('Settings saved successfully!');
        },
        onError: (err) => {
            toast.error(`Failed to save settings: ${err.message}`);
        }
    });

    const testMutation = useMutation({
        mutationFn: () => SettingsService.testTelegram(),
        onSuccess: () => {
            toast.success('Test notification sent! Check your Telegram.');
        },
        onError: (err) => {
            toast.error(`Test failed: ${err.message}`);
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-center text-white">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                    <p className="text-gray-500 mt-1">Manage external integrations and configuration.</p>
                </div>
            </div>

            {isLoading ? (
                <div className="text-gray-500">Loading settings...</div>
            ) : (
                <form onSubmit={handleSubmit} className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden shadow-2xl max-w-2xl">
                    <div className="p-6 border-b border-dark-border bg-dark-bg/30">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <BellDot size={20} className="text-blue-500" />
                            Telegram Notifications
                        </h3>
                        <p className="text-gray-500 text-xs mt-1">Configure bot to receive system alerts.</p>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Telegram Bot Token</label>
                            <input
                                name="TELEGRAM_BOT_TOKEN"
                                type="text"
                                value={formData.TELEGRAM_BOT_TOKEN}
                                onChange={handleChange}
                                placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz..."
                                className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-sm focus:border-dark-accent outline-none text-white transition-all font-mono"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Telegram Chat ID</label>
                            <input
                                name="TELEGRAM_CHAT_ID"
                                type="text"
                                value={formData.TELEGRAM_CHAT_ID}
                                onChange={handleChange}
                                placeholder="-1001234567890"
                                className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-sm focus:border-dark-accent outline-none text-white transition-all font-mono"
                            />
                            <p className="text-xs text-gray-500 pl-1">The chat or group ID where the bot will send alerts.</p>
                        </div>
                    </div>

                    <div className="p-4 border-t border-dark-border bg-dark-bg/30 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => testMutation.mutate()}
                            disabled={testMutation.isPending}
                            className="bg-dark-bg border border-dark-border hover:border-dark-accent text-white px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2"
                        >
                            <BellDot size={16} className="text-blue-500" />
                            {testMutation.isPending ? 'Testing...' : 'Test Connection'}
                        </button>
                        <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="bg-dark-accent hover:bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
                        >
                            <Save size={16} />
                            {mutation.isPending ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default Settings;
