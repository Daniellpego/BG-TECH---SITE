import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-bg-card', className)}
      style={{ backgroundImage: 'linear-gradient(90deg, #131F35 25%, #182640 50%, #131F35 75%)', backgroundSize: '200% 100%' }}
      {...props}
    />
  )
}

export { Skeleton }
