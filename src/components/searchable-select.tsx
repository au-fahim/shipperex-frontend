"use client";

import { ChevronDown, Search } from "lucide-react";
import type { KeyboardEvent } from "react";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

export type SearchableSelectOption = {
  value: string;
  label: string;
  keywords?: string;
  disabled?: boolean;
};

type SearchableSelectProps = {
  id?: string;
  value: string;
  options: SearchableSelectOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  maxOptions?: number;
  "aria-invalid"?: boolean;
  "aria-label"?: string;
};
type DropdownPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  placement: "above" | "below";
};

export function SearchableSelect({
  id,
  value,
  options,
  onValueChange,
  placeholder = "Choose an option",
  emptyMessage = "No matching options.",
  disabled = false,
  className = "",
  maxOptions,
  "aria-invalid": ariaInvalid,
  "aria-label": ariaLabel,
}: SearchableSelectProps) {
  const generatedId = useId().replaceAll(":", "");
  const inputId = id ?? `searchable-select-${generatedId}`;
  const listboxId = `${inputId}-options`;
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [listPosition, setListPosition] = useState<DropdownPosition | null>(
    null,
  );
  const selected = options.find((option) => option.value === value);
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return options;
    return options.filter((option) =>
      `${option.label} ${option.keywords ?? ""}`
        .toLocaleLowerCase()
        .includes(normalizedQuery),
    );
  }, [options, query]);
  const visibleOptions = useMemo(
    () => (maxOptions ? filtered.slice(0, maxOptions) : filtered),
    [filtered, maxOptions],
  );

  useEffect(() => {
    if (activeIndex >= 0) {
      optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex, visibleOptions.length]);

  useEffect(() => {
    function closeOnOutsidePointer(event: PointerEvent) {
      const target = event.target as Node;
      if (
        !rootRef.current?.contains(target) &&
        !listboxRef.current?.contains(target)
      ) {
        setOpen(false);
        setQuery("");
        setListPosition(null);
      }
    }
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, []);

  useEffect(() => {
    if (!open) return;

    function positionList() {
      const bounds = inputRef.current
        ?.closest(".searchable-select-control")
        ?.getBoundingClientRect();
      if (!bounds) return;

      const spaceBelow = Math.max(0, window.innerHeight - bounds.bottom - 12);
      const spaceAbove = Math.max(0, bounds.top - 12);
      const opensAbove = spaceBelow < 180 && spaceAbove > spaceBelow;
      const maxHeight = Math.max(
        100,
        Math.min(260, opensAbove ? spaceAbove : spaceBelow),
      );
      const viewportWidth = Math.max(1, window.innerWidth - 16);
      const inputStyle = window.getComputedStyle(inputRef.current!);
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (context) {
        context.font = `700 ${inputStyle.fontSize} ${inputStyle.fontFamily}`;
      }
      const widestOption = context
        ? visibleOptions.reduce(
            (widest, option) =>
              Math.max(widest, context.measureText(option.label).width),
            0,
          )
        : 0;
      // Keep option labels on one line whenever the viewport has room for them.
      // On narrow screens the viewport cap lets long labels wrap naturally.
      const width = Math.min(
        Math.max(bounds.width, Math.ceil(widestOption) + 56),
        viewportWidth,
      );
      const left = Math.max(
        8,
        Math.min(bounds.left, window.innerWidth - width - 8),
      );
      const top = opensAbove
        ? Math.max(8, bounds.top - maxHeight)
        : Math.min(bounds.bottom + 5, window.innerHeight - maxHeight - 8);

      setListPosition({
        top,
        left,
        width,
        maxHeight,
        placement: opensAbove ? "above" : "below",
      });
    }

    positionList();
    window.addEventListener("resize", positionList);
    window.addEventListener("scroll", positionList, true);
    return () => {
      window.removeEventListener("resize", positionList);
      window.removeEventListener("scroll", positionList, true);
    };
  }, [open, visibleOptions]);

  useLayoutEffect(() => {
    if (!open || !listPosition) return;

    const triggerBounds = inputRef.current
      ?.closest(".searchable-select-control")
      ?.getBoundingClientRect();
    const listBounds = listboxRef.current?.getBoundingClientRect();
    if (!triggerBounds || !listBounds) return;

    const top =
      listPosition.placement === "above"
        ? Math.max(8, triggerBounds.top - listBounds.height)
        : Math.min(
            triggerBounds.bottom + 5,
            window.innerHeight - listBounds.height - 8,
          );

    setListPosition((current) => {
      if (!current || Math.abs(current.top - top) < 1) return current;
      return { ...current, top };
    });
  }, [filtered, listPosition, open]);

  function close() {
    setOpen(false);
    setQuery("");
    setListPosition(null);
  }

  function choose(option: SearchableSelectOption) {
    if (option.disabled) return;
    onValueChange(option.value);
    close();
    inputRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        setQuery("");
        setActiveIndex(0);
      } else if (visibleOptions.length) {
        setActiveIndex((index) =>
          Math.min(index + 1, visibleOptions.length - 1),
        );
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        setQuery("");
        setActiveIndex(Math.max(visibleOptions.length - 1, 0));
      } else if (visibleOptions.length) {
        setActiveIndex((index) => Math.max(index - 1, 0));
      }
    } else if (event.key === "Enter" && open) {
      event.preventDefault();
      const option = visibleOptions[activeIndex];
      if (option) choose(option);
    } else if (event.key === "Enter") {
      event.preventDefault();
      setOpen(true);
      setQuery("");
      setActiveIndex(0);
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      close();
    } else if (event.key === "Tab") {
      close();
    }
  }

  return (
    <div
      className={`searchable-select ${className}`.trim()}
      ref={rootRef}
      data-open={open || undefined}
    >
      <div className="searchable-select-control">
        <Search size={15} aria-hidden="true" />
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-label={ariaLabel}
          aria-autocomplete="list"
          aria-invalid={ariaInvalid}
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={
            open && visibleOptions[activeIndex]
              ? `${listboxId}-${activeIndex}`
              : undefined
          }
          autoComplete="off"
          disabled={disabled}
          placeholder={open ? "Search options…" : placeholder}
          value={open ? query : (selected?.label ?? "")}
          onClick={() => {
            if (!open) {
              setOpen(true);
              setQuery("");
              setActiveIndex(0);
            }
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActiveIndex(0);
          }}
          onKeyDown={handleKeyDown}
          onBlur={(event) => {
            if (
              !rootRef.current?.contains(event.relatedTarget as Node | null)
            ) {
              close();
            }
          }}
        />
        <button
          type="button"
          className="searchable-select-toggle"
          tabIndex={-1}
          aria-label={open ? "Close options" : "Open options"}
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            if (open) close();
            else {
              setOpen(true);
              setQuery("");
              setActiveIndex(0);
              inputRef.current?.focus();
            }
          }}
        >
          <ChevronDown size={15} aria-hidden="true" />
        </button>
      </div>
      {open &&
        listPosition &&
        createPortal(
          <div
            ref={listboxRef}
            className="searchable-select-list"
            id={listboxId}
            role="listbox"
            style={{
              top: listPosition.top,
              left: listPosition.left,
              width: listPosition.width,
              maxHeight: listPosition.maxHeight,
            }}
          >
            {visibleOptions.length ? (
              <>
                {visibleOptions.map((option, index) => (
                  <div
                    key={option.value}
                    ref={(element) => {
                      optionRefs.current[index] = element;
                    }}
                    id={`${listboxId}-${index}`}
                    role="option"
                    aria-selected={option.value === value}
                    aria-disabled={option.disabled || undefined}
                    className={`searchable-select-option${
                      index === activeIndex ? " is-active" : ""
                    }${option.value === value ? " is-selected" : ""}`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => choose(option)}
                  >
                    <span>{option.label}</span>
                    {option.value === value && (
                      <span aria-hidden="true">✓</span>
                    )}
                  </div>
                ))}
                {filtered.length > visibleOptions.length && (
                  <div className="searchable-select-empty" role="status">
                    Showing {visibleOptions.length} of {filtered.length}{" "}
                    matches. Type to narrow the list.
                  </div>
                )}
              </>
            ) : (
              <div className="searchable-select-empty" role="status">
                {emptyMessage}
              </div>
            )}
          </div>,
          // Native dialogs live in the browser's top layer. Portal into the
          // dialog when present so searchable options stay above its backdrop.
          rootRef.current?.closest("dialog") ?? document.body,
        )}
    </div>
  );
}
