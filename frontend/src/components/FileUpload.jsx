import React, { useCallback, useState } from 'react';
import { Upload, FileAudio, FileVideo, X } from 'lucide-react';

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
        // Extended validation for MP4 and other common formats
        const validExtensions = ['.mp3', '.wav', '.mp4', '.m4a', '.ogg', '.webm'];
        const name = file.name.toLowerCase();

        const isValid = validExtensions.some(ext => name.endsWith(ext));

        if (isValid) {
            setSelectedFile(file);
            onFileSelect(file);
        } else {
            alert("Supported formats: MP3, WAV, MP4, M4A, OGG, WEBM");
        }
    };

    const removeFile = () => {
        setSelectedFile(null);
        onFileSelect(null);
    };

    const isVideo = selectedFile && (selectedFile.name.toLowerCase().endsWith('.mp4') || selectedFile.name.toLowerCase().endsWith('.webm'));

    return (
        <div className="w-full">
            {!selectedFile ? (
                <div
                    className={`glass-panel p-10 border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer
            ${isDragging ? 'border-purple-400 bg-purple-50' : 'border-slate-300 hover:border-purple-400 hover:bg-white/60'}`}
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
                        accept=".mp3,.wav,.mp4,.m4a,.ogg,.webm"
                        onChange={handleDisplayFile}
                    />
                    <div className="bg-purple-100 p-4 rounded-full mb-4 shadow-sm">
                        <Upload size={40} className="text-purple-500" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-slate-700">Drag & Drop Video or Audio</h3>
                    <p className="text-slate-400 mb-6">or click to browse (MP4, MP3, WAV...)</p>
                    <div className="text-sm text-slate-500 bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200">
                        .mp4 .mp3 .wav .m4a supported
                    </div>
                </div>
            ) : (
                <div className="glass-panel p-8 flex items-center justify-between animate-fade-in bg-white/60 border border-white/80">
                    <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-xl shadow-sm ${isVideo ? 'bg-indigo-50' : 'bg-blue-50'}`}>
                            {isVideo ? (
                                <FileVideo size={32} className="text-indigo-500" />
                            ) : (
                                <FileAudio size={32} className="text-blue-500" />
                            )}
                        </div>
                        <div className="text-left">
                            <p className="font-semibold text-lg text-slate-700">{selectedFile.name}</p>
                            <p className="text-sm text-slate-400">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); removeFile(); }}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors group"
                    >
                        <X size={20} className="text-slate-400 group-hover:text-red-500" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default FileUpload;
