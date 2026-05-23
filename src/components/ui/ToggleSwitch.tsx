"use client";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: "sm" | "md";
}

export default function ToggleSwitch({
  checked,
  onChange,
  label,
  disabled,
  size = "md",
}: ToggleSwitchProps) {
  const width = size === "sm" ? "w-9" : "w-11";
  const height = size === "sm" ? "h-5" : "h-6";
  const dotSize = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";
  const translateX = size === "sm" ? "translate-x-4" : "translate-x-5";

  return (
    <label className="inline-flex items-center gap-2 cursor-pointer">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex ${width} ${height} shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
          checked ? "bg-[var(--primary)]" : "bg-gray-300 dark:bg-gray-600"
        }`}
      >
        <span
          className={`pointer-events-none inline-block ${dotSize} transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? translateX : "translate-x-0.5"
          }`}
        />
      </button>
      {label && (
        <span className="text-sm text-main select-none">{label}</span>
      )}
    </label>
  );
}
