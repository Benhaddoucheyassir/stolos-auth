"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";

const length = 6;

export function VerificationCodeInput({
  label, digitLabel, readOnly, invalid, describedBy, onComplete, onEdit,
}: {
  label: string;
  digitLabel: string;
  readOnly: boolean;
  invalid: boolean;
  describedBy: string;
  onComplete: (code: string) => void;
  onEdit: () => void;
}) {
  const [digits, setDigits] = useState(() => Array<string>(length).fill(""));
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const submitted = useRef<string | null>(null);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  function update(next: string[]) {
    if (next.every((digit, index) => digit === digits[index])) return;
    setDigits(next);
    onEdit();
    const code = next.join("");
    if (code.length < length) {
      submitted.current = null;
    } else if (code !== submitted.current) {
      submitted.current = code;
      onComplete(code);
    }
  }

  function enter(index: number, value: string) {
    if (readOnly) return;
    if (/^\d{6}$/.test(value)) {
      update(value.split(""));
      inputs.current[length - 1]?.focus();
      return;
    }
    if (!/^\d*$/.test(value)) return;
    const next = [...digits];
    next[index] = value.slice(-1);
    update(next);
    if (value && index < length - 1) inputs.current[index + 1]?.focus();
  }

  function onKey(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      inputs.current[index + (event.key === "ArrowLeft" ? -1 : 1)]?.focus();
    } else if (event.key === "Backspace" && !readOnly) {
      event.preventDefault();
      const target = digits[index] ? index : Math.max(0, index - 1);
      enter(target, "");
      inputs.current[target]?.focus();
    }
  }

  return (
    <div role="group" aria-label={label} aria-describedby={describedBy} className="flex justify-center gap-[clamp(4px,1vw,12px)]">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(input) => { inputs.current[index] = input; }}
          aria-label={`${digitLabel} ${index + 1} / ${length}`}
          aria-invalid={invalid || undefined}
          autoComplete={index === 0 ? "one-time-code" : "off"}
          inputMode="numeric"
          type="text"
          readOnly={readOnly}
          value={digit}
          placeholder="0"
          className="h-[clamp(55px,8vh,80px)] w-[clamp(29px,6vw,52px)] min-w-0 rounded-[4px] border border-white/60 bg-white/5 text-center text-l font-semibold placeholder:text-white/25 focus-visible:outline-2 focus-visible:outline-primary aria-invalid:border-danger"
          onFocus={(event) => event.currentTarget.select()}
          onKeyDown={(event) => onKey(index, event)}
          onChange={(event) => enter(index, event.currentTarget.value)}
          onPaste={(event) => {
            event.preventDefault();
            const pasted = event.clipboardData.getData("text").trim();
            if (/^(?:\d|\d{6})$/.test(pasted)) enter(index, pasted);
          }}
        />
      ))}
    </div>
  );
}
