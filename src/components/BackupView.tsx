import { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { db } from '../db';
import { Download, Loader2, Database, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

export default function BackupView() {
    const [isExporting, setIsExporting] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleExport = async () => {
        setIsExporting(true);
        setProgress(0);
        try {
            const zip = new JSZip();

            // 1. Get all entries
            const entries = await db.dailyEntries.toArray();
            const total = entries.length;

            if (total === 0) {
                alert("No memories to backup yet!");
                setIsExporting(false);
                return;
            }

            // 2. Add metadata JSON
            const metadata = entries.map(e => ({
                id: e.id,
                date: e.date,
                caption: e.caption,
                timestamp: e.timestamp,
                imageFilename: `image_${e.id}.jpg`
            }));
            zip.file("data.json", JSON.stringify(metadata, null, 2));

            // 3. Add images folder
            const imgFolder = zip.folder("images");

            for (let i = 0; i < total; i++) {
                const entry = entries[i];
                if (entry.id && imgFolder && entry.photoBlob) {
                    imgFolder.file(`image_${entry.id}.jpg`, entry.photoBlob);
                    // Update progress
                    setProgress(Math.round(((i + 1) / total) * 100));
                }
            }

            // 4. Generate Zip
            const content = await zip.generateAsync({ type: "blob" });
            const filename = `daily_memories_backup_${new Date().toISOString().split('T')[0]}.zip`;
            saveAs(content, filename);

        } catch (error) {
            console.error("Backup failed:", error);
            alert("Backup failed. See console for details.");
        } finally {
            setIsExporting(false);
            setProgress(0);
        }
    };

    return (
        <div className="flex flex-col h-full p-6 bg-white overflow-y-auto">
            <div className="max-w-sm mx-auto w-full space-y-8 mt-10">
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto text-purple-600">
                        <Database size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Backup Your Memories</h2>
                    <p className="text-gray-500">
                        Create a zip file of all your photos and captions. Save it to "Files" or iCloud Drive.
                    </p>
                </div>

                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-start gap-3">
                    <AlertTriangle className="text-orange-500 shrink-0 mt-0.5" size={20} />
                    <p className="text-sm text-orange-700">
                        <strong>Important:</strong> Your data is only stored on this device. Regular backups prevent data loss if you clear browser cache or delete the app.
                    </p>
                </div>

                <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className={clsx(
                        "w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-3 text-white shadow-lg transition-all",
                        isExporting ? "bg-purple-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700 active:scale-95 shadow-purple-200"
                    )}
                >
                    {isExporting ? <Loader2 className="animate-spin" /> : <Download size={24} />}
                    {isExporting ? `Creating Backup (${progress}%)` : "Download Backup ZIP"}
                </button>

                <div className="text-center text-xs text-gray-400">
                    Uses high-performance compression. <br />
                    Images are preserved in original format.
                </div>
            </div>
        </div>
    );
}
