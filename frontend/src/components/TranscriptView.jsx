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
        <div className="glass-panel w-full p-6 animate-fade-in text-left">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-purple-200">Transcription Result</h3>
                <div className="flex gap-2">
                    <button
                        onClick={handleCopy}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-300 hover:text-white"
                        title="Copy to clipboard"
                    >
                        {copied ? <Check size={20} className="text-green-400" /> : <Copy size={20} />}
                    </button>
                    <button
                        onClick={handleDownload}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-300 hover:text-white"
                        title="Download as TXT"
                    >
                        <Download size={20} />
                    </button>
                </div>
            </div>
            <div className="bg-black/20 rounded-lg p-4 max-h-[400px] overflow-y-auto border border-gray-700/50">
                <p className="whitespace-pre-wrap text-gray-200 leading-relaxed">
                    {text || "No transcription available."}
                </p>
            </div>
        </div>
    );
};

export default TranscriptView;
