
import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, Play, AlertCircle, HelpCircle, FileText } from 'lucide-react';
import FileUpload from './components/FileUpload';
import TranscriptView from './components/TranscriptView';
import NoteGenerator from './components/NoteGenerator';
import './index.css';

function App() {
  const [file, setFile] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [model, setModel] = useState('base');
  const [language, setLanguage] = useState('auto');

  const handleTranscribe = async () => {
    if (!file) return;

    try {
      setIsLoading(true);
      setError('');
      setStatusMessage('Uploading to local engine...');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('model_size', model);
      if (language !== 'auto') {
        formData.append('language', language);
      }

      const response = await fetch('http://127.0.0.1:8000/transcribe', {
        method: 'POST',
        body: formData,
      });

      setStatusMessage('AI is listening and writing...');

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Processing failed');
      }

      const data = await response.json();
      setTranscript(data.transcript);
      setStatusMessage('');

    } catch (err) {
      console.error(err);
      setError(err.message || "An error occurred during transcription.");
      setStatusMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white p-4 md:p-10 flex flex-col items-center">

      {/* Header */}
      <header className="w-full max-w-4xl flex justify-center items-center mb-10">
        <div className="flex items-center gap-3 glass-panel px-6 py-3 rounded-full bg-black/40">
          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-2 rounded-full">
            <Sparkles className="text-white" size={20} />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-200 to-blue-200">
            Antigravity Speech
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in relative items-start">

        {/* Left Column: Usage Guide */}
        <div className="md:col-span-1 glass-panel p-6 text-left space-y-4 h-full bg-black/20">
          <div className="flex items-center gap-2 mb-2 text-purple-300">
            <HelpCircle size={20} />
            <h2 className="font-semibold text-lg">使い方 (How to Use)</h2>
          </div>
          <ol className="list-decimal list-inside space-y-3 text-sm text-gray-300 leading-relaxed">
            <li>
              <span className="font-medium text-white">設定を選択</span>
              <p className="pl-5 text-xs text-gray-400">モデルサイズと言語を選べます。</p>
            </li>
            <li>
              <span className="font-medium text-white">ファイルを選択</span>
              <p className="pl-5 text-xs text-gray-400">MP4(動画), MP3, WAVなどをドラッグ＆ドロップ。</p>
            </li>
            <li>
              <span className="font-medium text-white">Startボタンを押す</span>
              <p className="pl-5 text-xs text-gray-400">文字起こしが始まります。</p>
            </li>
            <li>
              <span className="font-medium text-white">記事作成</span>
              <p className="pl-5 text-xs text-gray-400">文字起こし後、Note用記事を生成できます。</p>
            </li>
          </ol>
          <div className="mt-6 pt-4 border-t border-gray-700/50">
            <p className="text-xs text-gray-500">
              Tips: MP4などの動画ファイルもそのままアップロード可能です。
            </p>
          </div>
        </div>

        {/* Right Column: App Functions */}
        <div className="md:col-span-2 flex flex-col gap-6">

          {/* Settings Panel */}
          <div className="glass-panel p-4 flex flex-col md:flex-row gap-4 items-center justify-between bg-black/20">
            <div className="flex items-center gap-3 w-full">
              <label className="text-sm text-gray-300 min-w-fit">Model:</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="bg-black/30 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-purple-500 w-full"
              >
                <option value="tiny">Tiny (Fastest)</option>
                <option value="base">Base (Balanced)</option>
                <option value="small">Small (Better)</option>
                <option value="medium">Medium (Detailed)</option>
                <option value="large">Large (Slowest)</option>
              </select>
            </div>
            <div className="flex items-center gap-3 w-full">
              <label className="text-sm text-gray-300 min-w-fit">Language:</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-black/30 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-purple-500 w-full"
              >
                <option value="auto">Auto Detect</option>
                <option value="ja">Japanese (日本語)</option>
                <option value="en">English (英語)</option>
              </select>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 text-red-200 border border-red-500/20 p-4 rounded-lg text-sm text-left flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Upload & Action */}
          <div className="space-y-6">
            <div className={isLoading ? "opacity-50 pointer-events-none grayscale transition-all" : "transition-all"}>
              <FileUpload onFileSelect={setFile} />
            </div>

            {file && !transcript && (
              <div className="flex flex-col items-center gap-4">
                {!isLoading ? (
                  <button
                    onClick={handleTranscribe}
                    className="btn-primary w-full md:w-auto flex justify-center items-center gap-3 px-10 py-4 text-xl font-bold group shadow-lg shadow-purple-900/20 hover:shadow-purple-700/40"
                  >
                    <Play fill="currentColor" className="group-hover:scale-110 transition-transform" />
                    Start Transcription
                  </button>
                ) : (
                  <div className="glass-panel p-8 w-full flex flex-col items-center justify-center gap-4 border-purple-500/30 bg-purple-900/10">
                    <Loader2 size={48} className="animate-spin text-purple-400" />
                    <div className="text-center">
                      <h3 className="text-xl font-semibold text-white mb-2">Processing...</h3>
                      <p className="text-purple-200 animate-pulse font-mono tracking-wide">{statusMessage}</p>
                      <div className="w-full bg-gray-700/50 h-1.5 mt-4 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500/50 animate-progress-indeterminate"></div>
                      </div>
                      <p className="text-xs text-gray-400 mt-4">Depending on file size and PC specs, this may take a few minutes.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Results */}
          {transcript && (
            <>
              <TranscriptView text={transcript} />
              <NoteGenerator transcript={transcript} />
            </>
          )}
        </div>

      </main>

      <footer className="mt-20 text-gray-500 text-xs text-center pb-10">
        Powered by OpenAI Whisper (Local) & LLM • React • Python
      </footer>

    </div>
  );
}

export default App;
