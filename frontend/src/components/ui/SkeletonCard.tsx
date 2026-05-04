import { GlassCard } from './GlassCard'

interface SkeletonCardProps {
  count?: number
}

export function SkeletonCard({ count = 1 }: SkeletonCardProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <GlassCard key={i}>
          <div className="space-y-3">
            <div className="h-4 w-20 bg-black/5 rounded animate-pulse" />
            <div className="h-10 w-24 bg-black/5 rounded animate-pulse" />
            <div className="h-3 w-16 bg-black/5 rounded animate-pulse" />
          </div>
        </GlassCard>
      ))}
    </>
  )
}
