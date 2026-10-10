"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { ArrowRight, X } from "lucide-react";
import type { ReactNode } from "react";

type ConfirmationDialogProps = {
  trigger: ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  destructive?: boolean;
};

export function ConfirmationDialog({
  trigger,
  title,
  description,
  confirmLabel,
  onConfirm,
  destructive = false,
}: ConfirmationDialogProps) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>{trigger}</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="confirm-overlay" />
        <AlertDialog.Content className="confirm-dialog">
          <div className="confirm-icon">
            <X size={18} />
          </div>
          <AlertDialog.Title className="confirm-title">
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className="confirm-description">
            {description}
          </AlertDialog.Description>
          <div className="confirm-actions">
            <AlertDialog.Cancel asChild>
              <button className="wizard-back">Keep it as is</button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                className={
                  destructive ? "confirm-destructive" : "workspace-primary"
                }
                onClick={onConfirm}
              >
                {confirmLabel} <ArrowRight size={14} />
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
