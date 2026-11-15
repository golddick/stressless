import * as React from 'react'

export function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={['input', className].filter(Boolean).join(' ')} />
}
