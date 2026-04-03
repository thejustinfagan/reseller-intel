'use client';

import { useState } from 'react';

interface FlagSheetProps {
  onSubmit: (reason: string, note: string) => void;
  onCancel: () => void;
}

const FLAG_REASONS = [
  'Wrong business type',
  'Closed / moved',
  'Bad data',
  'Not a prospect',
  'Duplicate',
];

export default function FlagSheet({ onSubmit, onCancel }: FlagSheetProps) {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [note, setNote] = useState('');

  function handleSubmit() {
    const reason = selectedReason || 'Flagged';
    onSubmit(reason, note);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 z-40"
        onClick={onCancel}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 max-w-[430px] mx-auto bg-[#1a1a1a] border-t border-white/10 rounded-t-2xl px-5 pt-4 pb-8 animate-slide-up">
        {/* Handle bar */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

        <h3 className="text-white font-bold text-lg mb-1">Flag this record</h3>
        <p className="text-gray-400 text-sm mb-4">Why doesn't this qualify?</p>

        {/* Reason chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {FLAG_REASONS.map((reason) => (
            <button
              key={reason}
              onClick={() => setSelectedReason(reason === selectedReason ? '' : reason)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                selectedReason === reason
                  ? 'bg-red-600 border-red-500 text-white'
                  : 'bg-transparent border-white/20 text-gray-300 hover:border-white/40'
              }`}
            >
              {reason}
            </button>
          ))}
        </div>

        {/* Optional note */}
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note..."
          rows={2}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white/25 resize-none mb-4"
        />

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-white/15 text-gray-300 font-medium text-sm hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedReason}
            className={`flex-1 py-3 rounded-xl font-medium text-sm transition-all ${
              selectedReason
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-white/10 text-gray-500 cursor-not-allowed'
            }`}
          >
            Submit Flag
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.25s ease-out forwards;
        }
      `}</style>
    </>
  );
}
