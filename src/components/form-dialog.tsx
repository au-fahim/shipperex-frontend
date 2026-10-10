"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useId, useRef } from "react";

type FormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
};

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: FormDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const generatedId = useId().replaceAll(":", "");
  const titleId = `form-dialog-title-${generatedId}`;
  const descriptionId = `form-dialog-description-${generatedId}`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="form-dialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
      }}
      onClose={() => {
        if (open) onOpenChange(false);
      }}
    >
      <section className="form-dialog-panel">
        <header className="form-dialog-header">
          <div>
            <h2 id={titleId}>{title}</h2>
            <p id={descriptionId}>{description}</p>
          </div>
          <button
            type="button"
            className="form-dialog-close"
            aria-label="Close form"
            onClick={() => onOpenChange(false)}
            autoFocus
          >
            <X size={17} />
          </button>
        </header>
        <div className="form-dialog-body">{children}</div>
      </section>
    </dialog>
  );
}
