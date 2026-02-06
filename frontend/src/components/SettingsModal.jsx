import React, { useState } from 'react';
import { Save, Lock, AlertCircle } from 'lucide-react';

const SettingsModal = ({ isOpen, onClose, onSave, hasCredentials }) => {
    const [jsonInput, setJsonInput] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSave = () => {
        try {
            if (!jsonInput.trim()) {
                setError("Cannot be empty");
                return;
            }
            // Basic Validation
            const parsed = JSON.parse(jsonInput);
            if (!parsed.type || parsed.type !== "service_account") {
                setError("Invalid Service Account JSON");
                return;
            }

            onSave(jsonInput);
            onClose();
        } catch (e) {
            setError("Invalid JSON format");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="glass-panel w-full max-w-lg p-6 relative bg-gray-900">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-yellow-500/10 p-2 rounded-lg">
                        <Lock className="text-yellow-500" size={24} />
                    </div>
                    <h2 className="text-xl font-bold">GCP Credentials</h2>
                </div>

                <p className="text-sm text-gray-400 mb-4 text-left">
                    Please paste your Google Cloud Service Account JSON key content here.
                    This is required to authenticate with the Speech-to-Text API.
                    <br /><span className="text-xs opacity-70">Credentials are stored in-memory only and not saved to disk.</span>
                </p>

                <textarea
                    className="w-full h-48 bg-black/30 border border-gray-700 rounded-lg p-3 text-xs font-mono text-gray-300 focus:border-purple-500 focus:outline-none resize-none mb-2"
                    placeholder='{"type": "service_account", ...}'
                    value={jsonInput}
                    onChange={(e) => { setJsonInput(e.target.value); setError(''); }}
                />

                {error && (
                    <div className="flex items-center gap-2 text-red-400 text-sm mb-4">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                <div className="flex justify-end gap-3 mt-4">
                    <button onClick={onClose} className="btn-secondary">Cancel</button>
                    <button onClick={handleSave} className="btn-primary flex items-center gap-2">
                        <Save size={18} />
                        Save Credentials
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
