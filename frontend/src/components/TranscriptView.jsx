import React from 'react';
import { Download, Copy, Check } from 'lucide-react';

const TranscriptView = ({ text }) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const element = document.createElement("a");
        const file = new Blob([text], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = "transcription.txt";
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    return (
        <div className="glass-panel w-full p-6 animate-fade-in text-left bg-white/70 border border-white/80">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-700">Transcription Result</h3>
                <div className="flex gap-2">
                    <button
                        onClick={handleCopy}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-purple-600"
                        title="Copy to clipboard"
                    >
                        {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                    </button>
                    <button
                        onClick={handleDownload}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-purple-600"
                        title="Download as TXT"
                    >
                        <Download size={20} />
                    </button>
                </div>
            </div>
            <div className="bg-white/80 rounded-xl p-6 max-h-[400px] overflow-y-auto border border-slate-200 shadow-inner">
                <p className="whitespace-pre-wrap text-slate-600 leading-relaxed text-sm">
                    {text || "No transcription available."}
                </p>
            </div>
        </div>
    );
};

export default TranscriptView;
