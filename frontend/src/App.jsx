import React, { useState } from 'react';
import { Settings, Sparkles, Loader2, Play } from 'lucide-react';
import FileUpload from './components/FileUpload';
import SettingsModal from './components/SettingsModal';
import TranscriptView from './components/TranscriptView';
import './index.css';

function App() {
  const [file, setFile] = useState(null);
  const [credentials, setCredentials] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTranscribe = async () => {
    if (!file) return;
    if (!credentials) {
      setError("Please configure GCP Credentials first.");
      setIsSettingsOpen(true);
      return;
    }

    setIsLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('credentials_json', credentials);

    try {
      const response = await fetch('http://127.0.0.1:8000/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Processing failed');
      }

      const data = await response.json();
      setTranscript(data.transcript);
    } catch (err) {
      console.error(err);
      setError(err.message || "An error occurred during transcription.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white p-4 md:p-10 flex flex-col items-center">

      {/* Header */}
      <header className="w-full max-w-4xl flex justify-between items-center mb-16">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-2 rounded-xl">
            <Sparkles className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-200 to-blue-200">
            Antigravity Speech
          </h1>
        </div>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm"
        >
          <Settings size={16} />
          <span className={credentials ? "text-green-400" : "text-gray-400"}>
            {credentials ? "Connected" : "Set Credentials"}
          </span>
        </button>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-2xl flex flex-col gap-8 animate-fade-in relative">

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 text-red-200 border border-red-500/20 p-4 rounded-lg text-sm text-left">
            {error}
          </div>
        )}

        {/* Upload Section */}
        <div className="space-y-6">
          <FileUpload onFileSelect={setFile} />

          {file && (
            <div className="flex justify-center">
              <button
                onClick={handleTranscribe}
                disabled={isLoading}
                className="btn-primary flex items-center gap-3 px-8 py-3 text-lg group"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play fill="currentColor" className="group-hover:scale-110 transition-transform" />
                    Start Transcription
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Results */}
        {transcript && <TranscriptView text={transcript} />}

      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={setCredentials}
      />

      <footer className="mt-20 text-gray-500 text-sm">
        Powered by Google Cloud Speech-to-Text • React • Python
      </footer>

    </div>
  );
}

export default App;
