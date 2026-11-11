import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Cloud,
  FileSpreadsheet,
  HardDrive,
  Globe,
  FolderTree,
  Download,
  Terminal,
  FileCode2,
  Layers,
  Sparkles,
} from 'lucide-react';
import { APPS_SCRIPT_FILES } from '../../constants/appsScriptCode';
import { useToast } from '../../components/Toast/Toast';

export const GasDeploymentGuidePage: React.FC = () => {
  const toast = useToast();
  const [activeFileName, setActiveFileName] = useState<string>('Config.gs');
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  const activeFile = APPS_SCRIPT_FILES.find((f) => f.filename === activeFileName) || APPS_SCRIPT_FILES[0];

  const handleCopyCode = (filename: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedFile(filename);
    toast.success(`Kode file ${filename} berhasil disalin ke clipboard!`);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  const handleDownloadFile = (filename: string, code: string) => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`File ${filename} berhasil diunduh!`);
  };

  return (
    <div id="gas-guide-page" className="space-y-8 max-w-5xl mx-auto">
      {/* 1. Header Hero */}
      <div className="bg-linear-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-800/30">
        <div className="flex items-center gap-2.5 mb-3">
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 font-mono text-xs font-semibold rounded-full border border-emerald-500/40 flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5" /> Backend & Database Modular Files
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          File Google Apps Script (GAS) Terpisah
        </h2>
        <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
          Semua file source code backend Google Apps Script telah dipisah menjadi <strong>12 file mandiri</strong>.
          Anda bisa langsung menyalin atau mengunduh masing-masing file satu per satu ke project Apps Script Anda.
        </p>
      </div>

      {/* 2. Step by Step Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Step 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">
            1
          </div>
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Buat Google Spreadsheet</span>
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Buat spreadsheet baru di Google Drive dengan judul{' '}
            <strong className="text-slate-800">&ldquo;DB_KORMI_DARMARAJA_V2&rdquo;</strong>.
            Lalu buka menu <strong>Ekstensi &gt; Apps Script</strong>.
          </p>
        </div>

        {/* Step 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-sm">
            2
          </div>
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
            <HardDrive className="w-4 h-4 text-blue-600" />
            <span>Buat File Sesuai Tab</span>
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Di Google Apps Script, buat 12 file script sesuai nama di bawah (misal: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-blue-700">Config.gs</code>, <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-blue-700">Code.gs</code>, dll).
          </p>
        </div>

        {/* Step 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 font-bold flex items-center justify-center text-sm">
            3
          </div>
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
            <Cloud className="w-4 h-4 text-purple-600" />
            <span>Setup & Deploy Web App</span>
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Jalankan fungsi <code className="bg-slate-100 px-1 py-0.5 rounded text-purple-700 font-mono">setupDatabase()</code> di <code className="font-mono">Setup.gs</code>, lalu klik <strong>Deploy &gt; New deployment &gt; Web app (Anyone)</strong>.
          </p>
        </div>
      </div>

      {/* 3. Notice About Dedicated /gas/ Directory */}
      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-start gap-3">
        <FolderTree className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-900 leading-relaxed">
          <p className="font-bold">Info Folder Project:</p>
          <p>
            Semua file individual <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-300 font-bold">.gs</code> ini
            juga telah disimpan langsung secara terpisah di dalam folder <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-300 font-bold">/gas/</code> pada root project (misalnya <code className="font-mono">/gas/Config.gs</code>, <code className="font-mono">/gas/Code.gs</code>, dll).
          </p>
        </div>
      </div>

      {/* 4. Interactive File Browser */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FileCode2 className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-800">
                {activeFile.filename}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {activeFile.description}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleDownloadFile(activeFile.filename, activeFile.code)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Unduh File</span>
            </button>

            <button
              onClick={() => handleCopyCode(activeFile.filename, activeFile.code)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              {copiedFile === activeFile.filename ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Salin Isi {activeFile.filename}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tab selector for GAS Files */}
        <div className="flex items-center gap-1.5 p-2.5 bg-slate-100/90 border-b border-slate-200 overflow-x-auto scrollbar-thin">
          {APPS_SCRIPT_FILES.map((file, idx) => (
            <button
              key={file.filename}
              onClick={() => setActiveFileName(file.filename)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all shrink-0 flex items-center gap-1.5 ${
                activeFileName === file.filename
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <span className="text-[10px] opacity-70">#{idx + 1}</span>
              <span>{file.filename}</span>
            </button>
          ))}
        </div>

        {/* Code View Area */}
        <div className="p-4 bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto max-h-[500px]">
          <pre className="leading-relaxed">
            <code>{activeFile.code}</code>
          </pre>
        </div>
      </div>

      {/* 5. Deployment Instructions Walkthrough */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-2xs space-y-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Globe className="w-5 h-5 text-emerald-600" />
          <span>Urutan Pembuatan File di Google Apps Script</span>
        </h3>

        <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            Di dalam editor Google Apps Script, buat file script baru (klik tanda <strong>+</strong> di samping *Files*) dengan nama-nama berikut:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2">
            {APPS_SCRIPT_FILES.map((f, i) => (
              <div key={f.filename} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="flex items-center gap-2 font-mono font-bold text-xs text-slate-800">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span>{f.filename}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
