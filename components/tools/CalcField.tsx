"use client";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
};

export default function CalcField({
  label,
  value,
  onChange,
  unit,
  min,
  max,
  step,
}: Props) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      <span className="flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          max={max}
          step={step}
          className="w-full rounded-md border border-line bg-surface px-3 py-2 font-mono text-sm tabular-nums focus:outline-2 focus:outline-fall"
        />
        {unit && <span className="shrink-0 text-sm text-muted">{unit}</span>}
      </span>
    </label>
  );
}
