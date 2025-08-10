import type * as React from 'react'
import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

const Label = forwardRef<
  React.ElementRef<'label'>,
  React.ComponentPropsWithoutRef<'label'>
>(({ className = '', ...props }, ref) => {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: This is a reusable label component
    <label
      ref={ref}
      className={cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className
      )}
      {...props}
    />
  )
})

Label.displayName = 'Label'

export { Label }
