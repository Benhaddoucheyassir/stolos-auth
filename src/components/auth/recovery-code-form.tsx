"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function RecoveryCodeForm({
  label, submitLabel, describedBy, busy, blocked, invalid, onSubmit, onEdit,
}: {
  label: string;
  submitLabel: string;
  describedBy: string;
  busy: boolean;
  blocked: boolean;
  invalid: boolean;
  onSubmit: (code: string) => void;
  onEdit: () => void;
}) {
  const [code, setCode] = useState("");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
  }, []);

  useEffect(() => {
    if (invalid) {
      input.current?.focus();
      input.current?.select();
    }
  }, [invalid]);

  return (
    <form className="flex w-full flex-col gap-xl" aria-busy={busy} onSubmit={(event) => {
      event.preventDefault();
      if (!busy && !blocked && code.trim()) onSubmit(code.trim());
    }}>
      <Input
        ref={input}
        aria-label={label}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        placeholder={label}
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        readOnly={busy}
        value={code}
        onChange={(event) => {
          setCode(event.currentTarget.value);
          onEdit();
        }}
        className="rounded-[8px] border border-white/40 bg-white/5 px-l py-sm focus-within:border-primary has-[input[aria-invalid=true]]:border-danger"
        inputClassName="min-h-[24px] text-sx placeholder:text-white/75"
      />
      <Button type="submit" variant="primary" size="lg" alignment="center" className="w-full min-h-[52px] rounded-[8px]"
        isLoading={busy} disabled={blocked || !code.trim()}>
        {submitLabel}
      </Button>
    </form>
  );
}
