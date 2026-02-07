import React, { useState } from 'react';
import { Sparkles, Copy, Check, Settings, MessageSquarePlus } from 'lucide-react';

const NoteGenerator = ({ transcript }) => {
    const [apiKey, setApiKey] = useState('');
    const [baseUrl, setBaseUrl] = useState('');
    const [model, setModel] = useState('gpt-3.5-turbo');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [generatedNote, setGeneratedNote] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [copiedTitle, setCopiedTitle] = useState(false);
    const [copiedBody, setCopiedBody] = useState(false);

    const handleGenerate = async () => {
        if (!transcript) return;
        setIsLoading(true);
        setError('');
        setGeneratedNote(null);

        try {
            const response = await fetch('http://127.0.0.1:8000/generate_note', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    transcript,
                    api_key: apiKey || undefined,
                    base_url: baseUrl || undefined,
                    model: model || 'gpt-3.5-turbo',
                }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Generation failed');
            }

            const data = await response.json();
            setGeneratedNote(data);
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to generate note.");
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = (text, type) => {
        navigator.clipboard.writeText(text);
        if (type === 'title') {
            setCopiedTitle(true);
            setTimeout(() => setCopiedTitle(false), 2000);
        } else {
            setCopiedBody(true);
            setTimeout(() => setCopiedBody(false), 2000);
        }
    };

    if (!transcript) return null;

    return (
        <div className="glass-panel w-full p-6 mt-6 animate-fade-in text-left border border-purple-500/20 bg-purple-900/5">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <MessageSquarePlus className="text-purple-300" size={24} />
                    <h2 className="text-xl font-bold text-white">Note Article Generator</h2>
                </div>
                <button
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white flex items-center gap-2 text-sm"
                >
                    <Settings size={16} />
                    {isSettingsOpen ? 'Hide Settings' : 'LLM Settings'}
                </button>
            </div>

            {/* Settings Section */}
            {isSettingsOpen && (
                <div className="mb-6 p-4 rounded-lg bg-black/30 border border-gray-700 space-y-4">
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">OpenAI API Key (Optional if using local LLM)</label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="sk-..."
                            className="w-full bg-black/50 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Base URL (Local LLM / OpenAI)</label>
                            <input
                                type="text"
                                value={baseUrl}
                                onChange={(e) => setBaseUrl(e.target.value)}
                                placeholder="https://api.openai.com/v1"
                                className="w-full bg-black/50 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Model Name</label>
                            <input
                                type="text"
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                placeholder="gpt-3.5-turbo"
                                className="w-full bg-black/50 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                            />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500">
                        * Leaves keys empty to check backend environment variables (.env).
                    </p>
                </div>
            )}

            {/* Generate Button */}
            {!generatedNote && (
                <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="w-full btn-primary py-3 flex justify-center items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <Sparkles className="animate-spin" size={20} />
                            Generating Content...
                        </>
                    ) : (
                        <>
                            <Sparkles size={20} />
                            Generate Note Article
                        </>
                    )}
                </button>
            )}

            {error && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 text-red-200 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* Result Display */}
            {generatedNote && (
                <div className="mt-8 space-y-6 animate-fade-in-up">

                    {/* Title Section */}
                    <div className="relative group">
                        <label className="text-xs text-purple-300 font-semibold mb-1 block uppercase tracking-wider">Title</label>
                        <div className="bg-black/30 border border-purple-500/30 p-4 rounded-lg text-xl font-bold text-white pr-12">
                            {generatedNote.title}
                        </div>
                        <button
                            onClick={() => copyToClipboard(generatedNote.title, 'title')}
                            className="absolute top-8 right-2 p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                        >
                            {copiedTitle ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                        </button>
                    </div>

                    {/* Body Section */}
                    <div className="relative group">
                        <label className="text-xs text-purple-300 font-semibold mb-1 block uppercase tracking-wider">Content</label>
                        <div className="bg-black/30 border border-purple-500/30 p-6 rounded-lg text-gray-200 whitespace-pre-wrap leading-relaxed min-h-[200px] pr-12">
                            {generatedNote.content}
                        </div>
                        <button
                            onClick={() => copyToClipboard(generatedNote.content, 'body')}
                            className="absolute top-8 right-2 p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                        >
                            {copiedBody ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                        </button>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="text-sm text-gray-400 hover:text-white underline mt-4"
                    >
                        Regenerate
                    </button>
                </div>
            )}
        </div>
    );
};

export default NoteGenerator;
