import { useRef, useState } from 'react';
import { History, Download, Upload, Info, ChevronRight } from 'lucide-react';
import { exportAllData, importAllData, type BackupPayload } from '../../db/queries';
import { useToast } from '../../context/ToastContext';
import type { View } from '../../types';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

export function MorePage({ onNavigate }: { onNavigate: (v: View) => void }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const { showToast } = useToast();

  async function handleExport() {
    const payload = await exportAllData();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const backupDate = new Date().toISOString().slice(0, 10).split('-').reverse().join('-');
    a.download = `attendance-backup-${backupDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup file downloaded');
  }

  async function confirmImport() {
    if (!pendingFile) return;
    try {
      const text = await pendingFile.text();
      const payload = JSON.parse(text) as BackupPayload;
      if (!Array.isArray(payload.subjects) || !Array.isArray(payload.attendance)) throw new Error('Invalid file');
      await importAllData(payload);
      showToast('Data restored from backup');
    } catch {
      showToast('Could not read that backup file — make sure it is a valid export from this app');
    }
    setPendingFile(null);
  }

  return (
    <div className="space-y-3">
      <Card onClick={() => onNavigate('audit')} className="flex items-center gap-3">
        <History size={18} className="text-ink-soft" />
        <span className="flex-1 text-sm font-medium text-ink">Audit log</span>
        <ChevronRight size={16} className="text-ink-faint" />
      </Card>

      <Card onClick={handleExport} className="flex items-center gap-3">
        <Download size={18} className="text-ink-soft" />
        <span className="flex-1 text-sm font-medium text-ink">Export backup (JSON)</span>
      </Card>

      <Card onClick={() => fileInput.current?.click()} className="flex items-center gap-3">
        <Upload size={18} className="text-ink-soft" />
        <span className="flex-1 text-sm font-medium text-ink">Import backup</span>
        <input
          ref={fileInput}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setPendingFile(f);
            e.target.value = '';
          }}
        />
      </Card>

      <Card className="flex gap-3">
        <Info size={18} className="text-ink-soft shrink-0 mt-0.5" />
        <p className="text-xs text-ink-soft leading-relaxed">
          All data lives only in this browser's IndexedDB storage — nothing is sent anywhere. It doesn't sync between
          devices, and clearing your browser data will erase it, audit log included. Export a backup regularly if you
          want a real safety copy.
        </p>
      </Card>

      {pendingFile && (
        <ConfirmDialog
          title="Replace all data?"
          description={`Importing "${pendingFile.name}" will permanently replace all current subjects, attendance records, timetable slots, and audit log entries on this device. This cannot be undone.`}
          confirmLabel="Import and replace"
          danger
          onConfirm={confirmImport}
          onCancel={() => setPendingFile(null)}
        />
      )}
    </div>
  );
}
