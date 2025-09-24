import React from 'react';

type Option = {
  id: number | string;
  label: string;
  option_text: string;
  is_correct?: boolean | number;
};

type Props = {
  index?: number;
  text: string;
  meta?: Array<{ label: string; value?: string | null }>;
  options: Option[];
  selected?: number | string | null;
  onSelect?: (optionId: number | string) => void;
  showCorrect?: boolean;
};

export default function QuestionCard({ index, text, meta = [], options, selected, onSelect, showCorrect }: Props) {
  const correct = options.find(o => !!o.is_correct);
  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 shadow-sm">
      <div className="mb-3">
        {!!meta.length && (
          <div className="flex flex-wrap gap-2 text-xs text-slate-300">
            {meta.map((m, i) => (
              m.value ? (
                <span key={i} className="px-2 py-1 bg-slate-900 rounded-md border border-slate-700">
                  <span className="text-slate-400">{m.label}:</span> {m.value}
                </span>
              ) : null
            ))}
          </div>
        )}
        <h3 className="text-base md:text-lg font-medium text-white mt-2">
          {typeof index === 'number' ? `${index + 1}. ` : ''}{text}
        </h3>
      </div>

      <div className="space-y-2 mt-3">
        {options.map(opt => {
          const isSelected = selected === opt.id;
          return (
            <button
              key={String(opt.id)}
              type="button"
              onClick={() => onSelect?.(opt.id)}
              className={`w-full text-left px-3 py-2 rounded-md border transition-colors ${
                isSelected
                  ? 'bg-sky-950 border-sky-700 text-white'
                  : 'bg-slate-900/60 border-slate-700 text-slate-100 hover:bg-slate-900'
              }`}
            >
              <span className="font-medium mr-2">{opt.label}.</span>
              {opt.option_text}
            </button>
          );
        })}
      </div>

      {showCorrect && correct && (
        <div className="mt-4 text-sm text-green-300">
          <span className="font-semibold">Correct Answer:</span> {correct.option_text}
        </div>
      )}
    </div>
  );
}
