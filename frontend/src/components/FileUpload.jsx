import React, { useCallback, useState } from 'react';
import { Upload, FileAudio, X } from 'lucide-react';

const FileUpload = ({ onFileSelect }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDragIn = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDragging(true);
        }
    }, []);

    const handleDragOut = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            validateAndSetFile(file);
        }
    }, [onFileSelect]);

    const handleDisplayFile = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            validateAndSetFile(e.target.files[0]);
        }
    }

    const validateAndSetFile = (file) => {
        // Check extension
        const validExtensions = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/x-wav'];
        // Just simple check on name usually fits better for user experience as mime types vary
        const name = file.name.toLowerCase();
        if (name.endsWith('.mp3') || name.endsWith('.wav')) {
            setSelectedFile(file);
            onFileSelect(file);
        } else {
            alert("Please upload MP3 or WAV files.");
        }
    };

    const removeFile = () => {
        setSelectedFile(null);
        onFileSelect(null);
    };

    return (
        <div className="w-full">
            {!selectedFile ? (
                <div
                    className={`glass-panel p-10 border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer
            ${isDragging ? 'border-purple-500 bg-purple-500/10' : 'border-gray-600 hover:border-gray-400'}`}
                    onDragEnter={handleDragIn}
                    onDragLeave={handleDragOut}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('fileInput').click()}
                    style={{ minHeight: '300px' }}
                >
                    <input
                        type="file"
                        id="fileInput"
                        className="hidden"
                        accept=".mp3,.wav"
                        onChange={handleDisplayFile}
                    />
                    <div className="bg-purple-500/20 p-4 rounded-full mb-4">
                        <Upload size={40} className="text-purple-300" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Drag & Drop Audio File</h3>
                    <p className="text-gray-400 mb-6">or click to browse (MP3, WAV)</p>
                    <div className="text-sm text-gray-500 bg-gray-800/50 px-3 py-1 rounded-full">
                        Max file size: 10MB (Demo)
                    </div>
                </div>
            ) : (
                <div className="glass-panel p-8 flex items-center justify-between animate-fade-in">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-500/20 p-3 rounded-lg">
                            <FileAudio size={32} className="text-blue-300" />
                        </div>
                        <div className="text-left">
                            <p className="font-semibold text-lg">{selectedFile.name}</p>
                            <p className="text-sm text-gray-400">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); removeFile(); }}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X size={20} className="text-gray-400 hover:text-white" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default FileUpload;
