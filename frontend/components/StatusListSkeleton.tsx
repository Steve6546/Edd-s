import { Skeleton } from "@/components/ui/skeleton"

export default function StatusListSkeleton() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 p-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2">
          <Skeleton className="h-20 w-20 rounded-full" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  )
}
