import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function TaskCardSkeleton() {
  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Task checkbox/indicator */}
          <Skeleton className="h-5 w-5 rounded-full mt-1" />

          {/* Task content */}
          <div className="flex-1 min-w-0">
            {/* Task title */}
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-5 w-3/4 rounded" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>

            {/* Task description */}
            <Skeleton className="h-4 w-full rounded mb-2" />
            <Skeleton className="h-4 w-2/3 rounded mb-3" />

            {/* Task metadata */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Due date */}
              <Skeleton className="h-4 w-20 rounded" />

              {/* Category badge */}
              <Skeleton className="h-5 w-16 rounded-full" />

              {/* Label badges */}
              <Skeleton className="h-5 w-12 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
