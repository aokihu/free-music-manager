"use client";

import { Check, ChevronDown, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { MusicTaxonomyOption } from "@/lib/music-catalog/music-taxonomy";

export function TaxonomyMultiSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly MusicTaxonomyOption[];
  value: readonly string[];
  onChange: (value: string[]) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selectedOptions = options.filter((option) => value.includes(option.id));

  useEffect(() => {
    if (!open) return;
    function closeOnOutsidePointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [open]);

  function toggleOption(optionId: string) {
    onChange(
      value.includes(optionId)
        ? value.filter((id) => id !== optionId)
        : [...value, optionId],
    );
  }

  return (
    <div className="relative" ref={rootRef}>
      <div className="min-h-11 rounded-lg border bg-white p-1.5 focus-within:border-zinc-400 focus-within:ring-2 focus-within:ring-zinc-100">
        <div className="flex min-h-7 flex-wrap items-center gap-1.5">
          {selectedOptions.length === 0 && (
            <span className="px-1.5 text-xs text-zinc-400">尚未选择</span>
          )}
          {selectedOptions.map((option) => (
            <span
              className="inline-flex h-7 items-center gap-1 rounded-full border bg-zinc-100 pl-2.5 pr-1 text-xs font-medium text-zinc-700"
              key={option.id}
            >
              {option.labels["zh-CN"]}
              <button
                type="button"
                className="grid size-5 place-items-center rounded-full text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700"
                aria-label={`删除${option.labels["zh-CN"]}`}
                onClick={() => toggleOption(option.id)}
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
        <button
          type="button"
          className="mt-1 flex h-8 w-full items-center justify-between rounded-md bg-zinc-50 px-2.5 text-xs text-zinc-500 hover:bg-zinc-100"
          aria-expanded={open}
          onClick={() => setOpen((currentOpen) => !currentOpen)}
        >
          选择{label}
          <ChevronDown
            className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
      </div>

      {open && (
        <div className="absolute left-0 top-[calc(100%+0.375rem)] z-30 max-h-64 w-full overflow-y-auto rounded-lg border bg-white p-1.5 shadow-lg">
          {options.map((option) => {
            const selected = value.includes(option.id);
            return (
              <Button
                type="button"
                className="h-auto w-full justify-between px-2.5 py-2 text-left"
                key={option.id}
                variant="ghost"
                aria-pressed={selected}
                onClick={() => toggleOption(option.id)}
              >
                <span className="min-w-0">
                  <span className="block text-xs font-medium">
                    {option.labels["zh-CN"]}
                  </span>
                  <span className="mt-0.5 block text-[10px] font-normal text-zinc-400">
                    {option.labels.en}
                  </span>
                </span>
                <span
                  className={`grid size-5 shrink-0 place-items-center rounded border ${
                    selected
                      ? "border-lime-500 bg-lime-300 text-zinc-900"
                      : "border-zinc-200 text-transparent"
                  }`}
                >
                  <Check className="size-3" aria-hidden="true" />
                </span>
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
