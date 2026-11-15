import * as React from 'react'

export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className = '', ...props }, ref) => (
    <label ref={ref} className={['field', className].filter(Boolean).join(' ')} {...props} />
  )
)

Label.displayName = 'Label'
