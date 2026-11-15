'use client'

import * as React from 'react'

type ButtonVariant = 'default' | 'outline' | 'ghost' | 'destructive'
type ButtonSize = 'default' | 'sm' | 'icon'

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  render?: React.ReactElement
}

export function Button({ className = '', variant = 'default', size = 'default', render, children, ...props }: ButtonProps) {
  const variantClass =
    variant === 'outline' ? 'btn g' :
    variant === 'ghost' ? 'btn g' :
    variant === 'destructive' ? 'btn d' :
    'btn p'

  const sizeClass = size === 'sm' ? 'btn sm' : size === 'icon' ? 'btn sm' : 'btn'
  const classes = [variantClass, sizeClass, className].filter(Boolean).join(' ')

  if (render) {
    const renderElement = render as React.ReactElement<any>
    return React.cloneElement(renderElement, {
      ...props,
      className: [renderElement.props.className, classes].filter(Boolean).join(' '),
      children: children ?? renderElement.props.children,
    })
  }

  return (
    <button {...props} className={classes}>
      {children}
    </button>
  )
}
