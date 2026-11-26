"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

export type StepNavItem<K extends string> = {
  key: K;
  label: string;
  icon: LucideIcon;
};

export function StepNav<K extends string>({
  ariaLabel,
  step,
  items,
  disabledKeys = [],
  onChange,
}: {
  ariaLabel: string;
  step: K;
  items: StepNavItem<K>[];
  disabledKeys?: K[];
  onChange: (step: K) => void;
}) {
  return (
    <nav aria-label={ariaLabel} className="mb-4 flex flex-wrap items-center gap-2">
      {items.map((item, index) => {
        const active = step === item.key;
        const disabled = disabledKeys.includes(item.key);
        const Icon = item.icon;
        return (
          <div key={item.key} className="flex items-center gap-2">
            {index > 0 ? (
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
            ) : null}
            <button
              type="button"
              onClick={() => onChange(item.key)}
              disabled={disabled}
              title={disabled ? "完成当前步骤后开放" : undefined}
              aria-current={active ? "step" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-md border px-3 py-1.5 text-left transition-colors",
                active
                  ? "border-primary/40 bg-primary/5 shadow-sm"
                  : "bg-card hover:bg-muted/60",
                disabled && "cursor-not-allowed opacity-50 hover:bg-card",
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground",
                )}
              >
                {index + 1}
              </span>
              <span className="flex items-center gap-1.5 text-[13px] font-medium">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                {item.label}
              </span>
            </button>
          </div>
        );
      })}
    </nav>
  );
}
