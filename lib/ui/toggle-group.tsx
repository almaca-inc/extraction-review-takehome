'use client'

import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export const ToggleGroup = forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root>
>(function ToggleGroup({ className, ...props }, ref) {
  return (
    <ToggleGroupPrimitive.Root
      ref={ref}
      className={cn('bg-card inline-flex items-center gap-1 rounded-md border p-0.5', className)}
      {...props}
    />
  )
})

export const ToggleGroupItem = forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>
>(function ToggleGroupItem({ className, ...props }, ref) {
  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        'hover:bg-accent focus-visible:ring-ring data-[state=on]:bg-primary data-[state=on]:text-primary-foreground inline-flex h-7 items-center justify-center rounded px-2.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none',
        className,
      )}
      {...props}
    />
  )
})
