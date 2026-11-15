'use client'

import * as React from 'react'

const SheetContext = React.createContext<{ open: boolean; setOpen: (open: boolean) => void } | null>(null)

export function Sheet({ open, onOpenChange, children }: { open?: boolean; onOpenChange?: (open: boolean) => void; children: React.ReactNode }) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isOpen = open ?? internalOpen

  const setOpen = (next: boolean) => {
    if (onOpenChange) onOpenChange(next)
    if (open === undefined) setInternalOpen(next)
  }

  return <SheetContext.Provider value={{ open: isOpen, setOpen }}>{children}</SheetContext.Provider>
}

type SheetTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  render?: React.ReactElement
}

export function SheetTrigger({ render, children, onClick, ...props }: SheetTriggerProps) {
  const ctx = React.useContext(SheetContext)

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event)
    if (!event.defaultPrevented && ctx) ctx.setOpen(!ctx.open)
  }

  if (render) {
    const renderElement = render as React.ReactElement<any>
    return React.cloneElement(renderElement, {
      ...props,
      ...renderElement.props,
      onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
        renderElement.props.onClick?.(event)
        handleClick(event)
      },
    })
  }

  return (
    <button {...props} onClick={handleClick}>
      {children}
    </button>
  )
}

type SheetContentProps = React.HTMLAttributes<HTMLDivElement> & {
  side?: 'left' | 'right'
  onClose?: () => void
}

export function SheetContent({ side = 'left', onClose, className = '', children, ...props }: SheetContentProps) {
  const ctx = React.useContext(SheetContext)
  if (!ctx || !ctx.open) return null

  return (
    <div className="sheet-overlay" onClick={() => { onClose?.(); ctx.setOpen(false) }}>
      <div
        className={['sheet-content', side === 'right' ? 'sheet-right' : 'sheet-left', className].filter(Boolean).join(' ')}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        {...props}
      >
        {children}
      </div>
    </div>
  )
}

export function SheetClose({ render, children, onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { render?: React.ReactElement }) {
  const ctx = React.useContext(SheetContext)

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event)
    if (!event.defaultPrevented && ctx) ctx.setOpen(false)
  }

  if (render) {
    const renderElement = render as React.ReactElement<any>
    return React.cloneElement(renderElement, {
      ...props,
      ...renderElement.props,
      onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
        renderElement.props.onClick?.(event)
        handleClick(event)
      },
    })
  }

  return <button {...props} onClick={handleClick}>{children}</button>
}

export function SheetHeader({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={['sheet-header', className].filter(Boolean).join(' ')} {...props} />
}

export function SheetTitle({ className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={['sheet-title', className].filter(Boolean).join(' ')} {...props} />
}

export function SheetDescription({ className = '', ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={['sheet-description', className].filter(Boolean).join(' ')} {...props} />
}

export function SheetFooter({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={['sheet-footer', className].filter(Boolean).join(' ')} {...props} />
}
