import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  appearance?: "auth";
  icon?: ReactNode;
  rightElement?: ReactNode;
  inputClassName?: string;
  containerClassName?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ appearance, icon, rightElement, className, inputClassName, containerClassName, ...props }, ref) => (
    <div className={cn("flex w-full min-w-0", containerClassName)}>
      <div className={cn(
        "flex min-w-0 flex-1 items-center",
        appearance === "auth" && "gap-s rounded-[8px] border border-white/40 bg-white/5 px-l py-sm focus-within:border-primary has-[input[aria-invalid=true]]:border-danger",
        className,
      )}>
        {icon && (
          <div className="relative flex size-6 shrink-0 items-center justify-center text-current">{icon}</div>
        )}
        <input
          ref={ref}
          className={cn(
            "min-w-0 flex-1 bg-transparent focus:outline-none",
            appearance === "auth" && "min-h-[24px] text-sx placeholder:text-white/75",
            inputClassName,
          )}
          {...props}
        />
        {rightElement && (
          <div className="relative flex size-6 shrink-0 items-center justify-center text-current">
            {rightElement}
          </div>
        )}
      </div>
    </div>
  ),
);

Input.displayName = "Input";
