import { Skeleton } from "@/components/ui/skeleton"

export default function MessageListSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4">
      {Array.from({ length: 6 }).map((_, i) => {
        const isOwnMessage = i % 3 === 0
        return (
          <div
            key={i}
            className={`flex gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
          >
            {!isOwnMessage && (
              <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
            )}
            <div className={`flex flex-col gap-1 max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
              {!isOwnMessage && <Skeleton className="h-3 w-20 mb-1" />}
              <Skeleton 
                className={`h-16 ${i % 2 === 0 ? 'w-64' : 'w-48'} rounded-2xl`}
              />
              <Skeleton className="h-2 w-16" />
            </div>
            {isOwnMessage && (
              <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
            )}
          </div>
        )
      })}
    </div>
  )
}
