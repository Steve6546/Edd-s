import { Skeleton } from "@/components/ui/skeleton"

export default function ProfileSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4">
      <Skeleton className="h-16 w-16 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  )
}
