"use client";

import { forwardRef, type InputHTMLAttributes, useId, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Input } from "./input";

export type PasswordInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "placeholder" | "size"
> & {
  label: string;
  errorMessage?: string;
  /** Accessible names of the show/hide button, to be translated by the caller. */
  visibilityLabels: { show: string; hide: string };
};

const EyeIcon = () => (
  <svg aria-hidden width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path
      d="M8.33333 10C8.33333 10.442 8.50893 10.866 8.82149 11.1785C9.13405 11.4911 9.55797 11.6667 10 11.6667C10.442 11.6667 10.866 11.4911 11.1785 11.1785C11.4911 10.866 11.6667 10.442 11.6667 10C11.6667 9.55797 11.4911 9.13405 11.1785 8.82149C10.866 8.50893 10.442 8.33333 10 8.33333C9.55797 8.33333 9.13405 8.50893 8.82149 8.82149C8.50893 9.13405 8.33333 9.55797 8.33333 10ZM17.5 10C15.5 13.3333 13 15 10 15C7 15 4.5 13.3333 2.5 10C4.5 6.66667 7 5 10 5C13 5 15.5 6.66667 17.5 10Z"
      stroke="white"
      strokeOpacity="0.5"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    { label, errorMessage, visibilityLabels, id, className, disabled, readOnly, "aria-describedby": describedBy, ...props },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;
    const [isVisible, setIsVisible] = useState(false);

    return (
      <div className={cn("flex w-full flex-col gap-xs", className)}>
        <label htmlFor={inputId} className="sr-only">{label}</label>
        <Input
          {...props}
          appearance="auth"
          ref={ref}
          type={isVisible ? "text" : "password"}
          readOnly={readOnly}
          disabled={disabled}
          aria-invalid={errorMessage ? true : props["aria-invalid"]}
          id={inputId}
          aria-describedby={
            [describedBy, errorMessage ? errorId : undefined].filter(Boolean).join(" ") || undefined
          }
          placeholder={label}
          rightElement={
            <Button
              type="button"
              variant="ghostMonochrome"
              className="size-6 items-center justify-center rounded-sm p-0 focus-visible:outline focus-visible:outline-white/60"
              aria-label={isVisible ? visibilityLabels.hide : visibilityLabels.show}
              aria-pressed={isVisible}
              aria-controls={inputId}
              disabled={disabled || readOnly}
              onClick={() => setIsVisible((visible) => !visible)}
            >
              <EyeIcon />
            </Button>
          }
        />
        {errorMessage && (
          <p id={errorId} role="alert" className="text-sx text-red-200">
            {errorMessage}
          </p>
        )}
      </div>
    );
  },
);

PasswordInput.displayName = "PasswordInput";
