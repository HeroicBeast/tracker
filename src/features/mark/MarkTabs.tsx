import { useState } from 'react';
import type { Subject } from '../../db/types';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { SingleMarkForm } from './SingleMarkForm';
import { BulkAddForm } from './BulkAddForm';

export function MarkTabs({ lockedSubject, onDone }: { lockedSubject?: Subject; onDone?: () => void }) {
  const [mode, setMode] = useState<'single' | 'bulk'>('single');

  return (
    <div className="space-y-4">
      <SegmentedControl
        value={mode}
        onChange={setMode}
        options={[
          { value: 'single', label: 'Single entry' },
          { value: 'bulk', label: 'Bulk add' },
        ]}
      />
      {mode === 'single' ? (
        <SingleMarkForm lockedSubject={lockedSubject} onDone={onDone} />
      ) : (
        <BulkAddForm lockedSubject={lockedSubject} onDone={onDone} />
      )}
    </div>
  );
}
