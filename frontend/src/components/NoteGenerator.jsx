
import React, { useState } from 'react';
import { Sparkles, Copy, Check, Settings, MessageSquarePlus, Loader2 } from 'lucide-react';

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

    // New State for Refinement
    const [refinedText, setRefinedText] = useState('');
    const [isRefining, setIsRefining] = useState(false);

    const handleRefine = async () => {
        if (!transcript) return;
        setIsRefining(true);
        setError('');

        try {
            const response = await fetch('http://127.0.0.1:8000/refine_text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transcript,
                    api_key: apiKey || undefined,
                    base_url: baseUrl || undefined,
                    model: model || 'gpt-3.5-turbo',
                }),
            });

            if (!response.ok) throw new Error('Refinement failed');
            const data = await response.json();
            setRefinedText(data.refined_text);
        } catch (err) {
            console.error(err);
            setError("Failed to refine text.");
        } finally {
            setIsRefining(false);
        }
    };

    const handleGenerate = async () => {
        // Use refined text if available, otherwise raw transcript
        const sourceText = refinedText || transcript;

        if (!sourceText) return;
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
                    transcript: sourceText,
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
        <div className="glass-panel w-full p-6 mt-6 animate-fade-in text-left border border-white/60 bg-white/40 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                        <MessageSquarePlus size={20} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-700">Note Article Generator</h2>
                </div>
                <button
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className="p-2 hover:bg-white/50 rounded-lg transition-colors text-slate-400 hover:text-purple-600 flex items-center gap-2 text-sm"
                >
                    <Settings size={16} />
                    {isSettingsOpen ? 'Hide Settings' : 'LLM Settings'}
                </button>
            </div>

            {/* Settings Section */}
            {isSettingsOpen && (
                <div className="mb-6 p-6 rounded-xl bg-white/50 border border-white/80 space-y-4 shadow-sm">
                    <div>
                        <label className="block text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">OpenAI API Key (Optional)</label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="sk-..."
                            className="w-full bg-white/80 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all placeholder:text-slate-300"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Base URL</label>
                            <input
                                type="text"
                                value={baseUrl}
                                onChange={(e) => setBaseUrl(e.target.value)}
                                placeholder="https://api.openai.com/v1"
                                className="w-full bg-white/80 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all placeholder:text-slate-300"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Model Name</label>
                            <input
                                type="text"
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                placeholder="gpt-3.5-turbo"
                                className="w-full bg-white/80 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-200 transition-all placeholder:text-slate-300"
                            />
                        </div>
                    </div>
                    <p className="text-xs text-slate-400">
                        * Leave empty to check backend environment variables (.env).
                    </p>
                </div>
            )}

            {/* 1. Refine Text Step */}
            <div className="mb-8">
                <label className="text-xs text-purple-600 font-bold mb-2 block uppercase tracking-wider">
                    Step 1: Refine Tone (Soft & Polite)
                </label>

                {/* Textarea for Refined Text */}
                <textarea
                    value={refinedText || (isRefining ? "Refining text..." : "")}
                    onChange={(e) => setRefinedText(e.target.value)}
                    placeholder="Original transcript will be used if not refined. Click 'Refine Text' to make it softer."
                    className="w-full h-40 bg-white/80 border border-purple-100 p-4 rounded-xl text-slate-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-200 mb-2 resize-y"
                    disabled={isRefining}
                />

                <button
                    onClick={handleRefine}
                    disabled={isRefining || isLoading}
                    className="btn-secondary w-full md:w-auto text-sm flex justify-center items-center gap-2"
                >
                    {isRefining ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                    {refinedText ? "Re-Refine Text" : "Refine Text (Make it Soft)"}
                </button>
            </div>

            {/* 2. Generate Note Step */}
            <div className="mb-4">
                <label className="text-xs text-purple-600 font-bold mb-2 block uppercase tracking-wider">
                    Step 2: Generate Note Article
                </label>
                {!generatedNote && (
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || isRefining}
                        className="w-full btn-primary py-3 flex justify-center items-center gap-2 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-purple-200"
                    >
                        {isLoading ? (
                            <>
                                <Sparkles className="animate-spin" size={20} />
                                Creating Magic...
                            </>
                        ) : (
                            <>
                                <Sparkles size={20} />
                                Generate Note Article
                            </>
                        )}
                    </button>
                )}
            </div>

            {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm shadow-sm">
                    {error}
                </div>
            )}

            {/* Result Display */}
            {generatedNote && (
                <div className="mt-8 space-y-6 animate-fade-in-up">

                    {/* Title Section */}
                    <div className="relative group">
                        <label className="text-xs text-purple-600 font-bold mb-2 block uppercase tracking-wider">Title</label>
                        <div className="bg-white/80 border border-purple-100 p-4 rounded-xl text-xl font-bold text-slate-800 pr-12 shadow-sm">
                            {generatedNote.title}
                        </div>
                        <button
                            onClick={() => copyToClipboard(generatedNote.title, 'title')}
                            className="absolute top-9 right-3 p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-purple-600 transition-colors"
                        >
                            {copiedTitle ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                        </button>
                    </div>

                    {/* Body Section */}
                    <div className="relative group">
                        <label className="text-xs text-purple-600 font-bold mb-2 block uppercase tracking-wider">Content</label>
                        <div className="bg-white/80 border border-purple-100 p-6 rounded-xl text-slate-600 whitespace-pre-wrap leading-relaxed min-h-[200px] pr-12 shadow-sm">
                            {generatedNote.content}
                        </div>
                        <button
                            onClick={() => copyToClipboard(generatedNote.content, 'body')}
                            className="absolute top-9 right-3 p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-purple-600 transition-colors"
                        >
                            {copiedBody ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                        </button>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="text-sm text-slate-400 hover:text-purple-600 underline mt-4 transition-colors"
                    >
                        Regenerate
                    </button>
                </div>
            )}
        </div>
    );
};

export default NoteGenerator;
