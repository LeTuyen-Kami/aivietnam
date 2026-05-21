'use client'

import * as Dialog from '@radix-ui/react-dialog'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/ui'

export type ConfirmModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void | Promise<void>
  pending?: boolean
  confirmVariant?: 'default' | 'destructive'
  className?: string
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  onConfirm,
  pending = false,
  confirmVariant = 'default',
  className,
}) => {
  const handleConfirm = async () => {
    await onConfirm()
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-[200] bg-black/50" />
        <Dialog.Content
          className={cn(
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-[201] w-[min(100vw-2rem,420px)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card p-6 shadow-lg outline-none',
            className,
          )}
        >
          <Dialog.Title className="text-lg font-semibold text-foreground">{title}</Dialog.Title>
          {description ? (
            <Dialog.Description className="mt-2 text-sm text-muted-foreground">
              {description}
            </Dialog.Description>
          ) : null}

          <div className="mt-6 flex justify-end gap-2">
            <Button
              className="cursor-pointer active:scale-95"
              disabled={pending}
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {cancelLabel}
            </Button>
            <Button
              className="cursor-pointer active:scale-95"
              disabled={pending}
              type="button"
              variant={confirmVariant}
              onClick={() => {
                void handleConfirm()
              }}
            >
              {pending ? 'Đang xử lý…' : confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
