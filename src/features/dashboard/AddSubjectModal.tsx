import { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { addSubject } from '../../db/queries';
import { useToast } from '../../context/ToastContext';
import type { Credits } from '../../db/types';

export function AddSubjectModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [credits, setCredits] = useState<Credits>(3);
  const { showToast } = useToast();

  async function handleSubmit() {
    if (!name.trim()) return;
    await addSubject(name, credits);
    showToast(`Added "${name.trim()}"`);
    onClose();
  }

  return (
    <Modal
      title="Add subject"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={!name.trim()}>
            Add subject
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="text-xs text-ink-faint mb-1.5 block">Subject name</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="e.g. Cost Accounting"
            className="w-full h-11 rounded-xl bg-surface-hover border border-line px-3 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-accent/50"
          />
        </div>
        <div>
          <label className="text-xs text-ink-faint mb-1.5 block">Credits</label>
          <div className="grid grid-cols-4 gap-2">
            {([1, 2, 3, 4] as Credits[]).map((c) => (
              <button
                key={c}
                onClick={() => setCredits(c)}
                className={`h-11 rounded-xl border text-sm font-medium transition-colors ${
                  credits === c ? 'bg-accent-solid border-accent-solid text-white' : 'bg-surface-hover border-line text-ink-soft'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
