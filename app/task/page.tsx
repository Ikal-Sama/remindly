"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ActionButton from "@/components/action-button";
import { authClient } from "@/lib/auth/auth-client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import CreateTask from "@/components/user/task/create";
import EditTask from "@/components/user/task/edit";
import {
  Plus,
  CheckCircle,
  Circle,
  Calendar,
  Filter,
  DotSquare,
  CircleCheck,
  Trash2,
  MoreHorizontal,
  Edit,
  X,
  Tag,
  Hash,
} from "lucide-react";
import {
  getLoggedInUserAllTasks,
  completeTask,
  deleteTask,
} from "@/app/action/task";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { VerifyEmail } from "@/components/verify-email";

interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: Date | null;
  reminderDate?: Date | null;
  isCompleted: boolean;
  createdAt: Date;
  category?: {
    id: string;
    name: string;
    color: string;
  } | null;
  labels?: Array<{
    id: string;
    label: {
      id: string;
      name: string;
      color: string;
      createdAt: Date;
      updatedAt: Date;
      userId: string;
    };
  }>;
  updatedAt: Date;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Label {
  id: string;
  name: string;
  color: string;
}

export default function TaskListPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  interface User {
    id: string;
    email?: string;
    emailVerified?: boolean;
    image?: string | null;
  }

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPro, setIsPro] = useState(false);

  // Filter states
  const [completionFilter, setCompletionFilter] = useState<
    "all" | "completed" | "incomplete"
  >("all");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await authClient.getSession();
        if (!session.data?.user) {
          router.push("/login");
          return;
        }

        // Check if email is verified
        if (!session.data.user.emailVerified) {
          setUser(session.data.user);
          setLoading(false);
          return;
        }

        setUser(session.data.user);
      } catch (error) {
        console.error("Auth error:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      setTasksLoading(true);
      try {
        // Fetch tasks
        const tasksResult = await getLoggedInUserAllTasks(user.id);
        if (tasksResult.success) {
          const tasksWithDates =
            tasksResult.tasks?.map((task) => ({
              ...task,
              dueDate: task.dueDate ? new Date(task.dueDate) : null,
              reminderDate: task.reminderDate
                ? new Date(task.reminderDate)
                : null,
              createdAt: new Date(task.createdAt),
              updatedAt: new Date(task.updatedAt || task.createdAt),
            })) || [];
          setTasks(tasksWithDates);
        } else {
          toast.error("Failed to fetch tasks");
        }

        // Fetch categories
        const categoriesResponse = await fetch("/api/categories");
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          setCategories(categoriesData.categories || []);
        }

        // Fetch labels
        const labelsResponse = await fetch("/api/labels");
        if (labelsResponse.ok) {
          const labelsData = await labelsResponse.json();
          setLabels(labelsData.labels || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Something went wrong");
      } finally {
        setTasksLoading(false);
      }
    };

    const fetchSubscription = async () => {
      if (!user) return;

      try {
        const response = await fetch("/api/subscription/create", {
          method: "GET",
        });

        if (response.ok) {
          const data = await response.json();
          const currentPlan: string | undefined =
            data?.currentSubscription?.plan?.name;
          setIsPro(currentPlan === "PRO");
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
      }
    };

    fetchData();
    fetchSubscription();
  }, [user, router]);

  const createTask = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/subscription/create");

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to check subscription status");
      }

      const data = await response.json();

      if (!data?.hasActiveSubscription) {
        router.push("/choose-plan");
        return;
      }

      setIsDialogOpen(true);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter tasks based on all filters
  const filteredTasks = tasks.filter((task) => {
    // Completion filter
    if (completionFilter === "completed" && !task.isCompleted) return false;
    if (completionFilter === "incomplete" && task.isCompleted) return false;

    // Category filter
    if (selectedCategories.length > 0) {
      if (!task.category || !selectedCategories.includes(task.category.id)) {
        return false;
      }
    }

    // Label filter
    if (selectedLabels.length > 0) {
      const taskLabelIds = task.labels?.map((tl) => tl.label.id) || [];
      const hasMatchingLabel = selectedLabels.some((labelId) =>
        taskLabelIds.includes(labelId)
      );
      if (!hasMatchingLabel) {
        return false;
      }
    }

    return true;
  });

  const handleCompleteTask = async (taskId: string) => {
    if (!user) return;

    // Task is found and its completion status is checked implicitly

    setActionLoading(taskId);
    try {
      const result = await completeTask(taskId, user.id);
      if (result.success) {
        const fetchResult = await getLoggedInUserAllTasks(user.id);
        if (fetchResult.success) {
          setTasks(fetchResult.tasks || []);
        }
        toast.success("Task completed!");
      } else {
        toast.error(result.error || "Failed to complete task");
      }
    } catch (error) {
      console.error("Complete task error:", error);
      toast.error("Something went wrong");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!user) return;

    setActionLoading(taskId);
    try {
      const result = await deleteTask(taskId, user.id);
      if (result.success) {
        const fetchResult = await getLoggedInUserAllTasks(user.id);
        if (fetchResult.success) {
          setTasks(fetchResult.tasks || []);
        }
        toast.success("Task deleted!");
      } else {
        toast.error(result.error || "Failed to delete task");
      }
    } catch (error) {
      console.error("Delete task error:", error);
      toast.error("Something went wrong");
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsEditDialogOpen(true);
  };

  const clearAllFilters = () => {
    setCompletionFilter("all");
    setSelectedCategories([]);
    setSelectedLabels([]);
  };

  const TaskCard = ({ task }: { task: Task }) => (
    <Card className="hover:shadow-md transition-shadow border-dashed bg-transparent">
      <CardContent className="">
        <div className="flex justify-between items-start">
          <div className="flex flex-col items-start mb-2">
            <div className="flex text-xs text-muted-foreground mb-1">
              <span>{task.createdAt.toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              {task.isCompleted ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <Circle className="w-5 h-5 text-gray-400" />
              )}
              <h3
                className={cn(
                  "font-medium",
                  task.isCompleted
                    ? "text-primary line-through"
                    : "text-primary"
                )}
              >
                {task.title}
              </h3>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <ActionButton
                size="icon-sm"
                variant="ghost"
                className="cursor-pointer rounded-full"
              >
                <MoreHorizontal className="w-4 h-4" />
              </ActionButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {!task.isCompleted && (
                <DropdownMenuItem
                  onClick={() => handleCompleteTask(task.id)}
                  disabled={actionLoading === task.id}
                  className="text-green-600 focus:text-green-600"
                >
                  <CircleCheck className="w-4 h-4 mr-2" />
                  Complete
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => handleEditTask(task)}
                className="text-blue-600 focus:text-blue-600"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDeleteTask(task.id)}
                disabled={actionLoading === task.id}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {task.description && (
          <p
            className={cn(
              "text-sm mb-3",
              task.isCompleted ? "text-gray-400" : "text-gray-600"
            )}
          >
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-xs text-gray-500">
          {task.category && (
            <div className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: task.category.color }}
              />
              <span>{task.category.name}</span>
            </div>
          )}
          {task.dueDate && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
            </div>
          )}
          {task.reminderDate && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>
                Reminder: {new Date(task.reminderDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {task.labels && task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {task.labels.map((taskLabel) => (
              <div
                key={taskLabel.id}
                className="px-2 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: `${taskLabel.label.color}20`,
                  color: taskLabel.label.color,
                  border: `1px solid ${taskLabel.label.color}40`,
                }}
              >
                {taskLabel.label.name}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <Spinner />
      </div>
    );
  }

  // Show VerifyEmail component if user's email is not verified
  if (user && !user.emailVerified && user.email) {
    return <VerifyEmail email={user.email} />;
  }

  return (
    <div className="p-10">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <ActionButton size="sm" onClick={createTask} loading={isLoading}>
          <Plus size={16} />{" "}
          <span className="hidden sm:inline">Create Task</span>
        </ActionButton>
      </div>

      {/* Enhanced Filters Section */}
      <div className="mt-8 p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm transition-all duration-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Task Filters
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            disabled={
              completionFilter === "all" &&
              selectedCategories.length === 0 &&
              selectedLabels.length === 0
            }
          >
            <X className="w-4 h-4 mr-1.5" />
            Clear All
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Completion Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={completionFilter !== "all" ? "secondary" : "outline"}
                size="sm"
                className="flex items-center gap-2 transition-all duration-200 hover:shadow-sm"
              >
                <Filter className="w-4 h-4" />
                <span>Status</span>
                {completionFilter !== "all" && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                    {completionFilter === "completed"
                      ? "Completed"
                      : "Incomplete"}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48" align="start">
              <DropdownMenuItem
                onClick={() => setCompletionFilter("all")}
                className={cn(
                  "cursor-pointer",
                  completionFilter === "all" && "bg-gray-100 dark:bg-gray-700"
                )}
              >
                <div className="flex items-center w-full">
                  <span className="mr-2">•</span>
                  <span>All Tasks</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setCompletionFilter("completed")}
                className={cn(
                  "cursor-pointer",
                  completionFilter === "completed" &&
                    "bg-gray-100 dark:bg-gray-700"
                )}
              >
                <div className="flex items-center w-full">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  <span>Completed</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setCompletionFilter("incomplete")}
                className={cn(
                  "cursor-pointer",
                  completionFilter === "incomplete" &&
                    "bg-gray-100 dark:bg-gray-700"
                )}
              >
                <div className="flex items-center w-full">
                  <Circle className="w-4 h-4 mr-2 text-gray-400" />
                  <span>Incomplete</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Category Filter */}
          {categories.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={
                    selectedCategories.length > 0 ? "secondary" : "outline"
                  }
                  size="sm"
                  className="flex items-center gap-2 transition-all duration-200 hover:shadow-sm"
                >
                  <Tag className="w-4 h-4" />
                  <span>Categories</span>
                  {selectedCategories.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                      {selectedCategories.length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-64 max-h-80 overflow-y-auto p-2"
                align="start"
              >
                <div className="p-1">
                  <p className="px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Select categories
                  </p>
                  {categories.map((category) => (
                    <DropdownMenuCheckboxItem
                      key={category.id}
                      checked={selectedCategories.includes(category.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedCategories([
                            ...selectedCategories,
                            category.id,
                          ]);
                        } else {
                          setSelectedCategories(
                            selectedCategories.filter(
                              (id) => id !== category.id
                            )
                          );
                        }
                      }}
                      className="px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="truncate">{category.name}</span>
                      </div>
                    </DropdownMenuCheckboxItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Label Filter */}
          {labels.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={selectedLabels.length > 0 ? "secondary" : "outline"}
                  size="sm"
                  className="flex items-center gap-2 transition-all duration-200 hover:shadow-sm"
                >
                  <Hash className="w-4 h-4" />
                  <span>Labels</span>
                  {selectedLabels.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                      {selectedLabels.length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-64 max-h-80 overflow-y-auto p-2"
                align="start"
              >
                <div className="p-1">
                  <p className="px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Select labels
                  </p>
                  {labels.map((label) => (
                    <DropdownMenuCheckboxItem
                      key={label.id}
                      checked={selectedLabels.includes(label.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedLabels([...selectedLabels, label.id]);
                        } else {
                          setSelectedLabels(
                            selectedLabels.filter((id) => id !== label.id)
                          );
                        }
                      }}
                      className="px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: label.color }}
                        />
                        <span className="truncate">{label.name}</span>
                      </div>
                    </DropdownMenuCheckboxItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Active Filters Display */}
        {(completionFilter !== "all" ||
          selectedCategories.length > 0 ||
          selectedLabels.length > 0) && (
          <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Active filters:
              </span>

              {/* Status Filter Badge */}
              {completionFilter !== "all" && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => setCompletionFilter("all")}
                >
                  Status:{" "}
                  {completionFilter === "completed"
                    ? "Completed"
                    : "Incomplete"}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              )}

              {/* Category Filter Badges */}
              {selectedCategories.map((categoryId) => {
                const category = categories.find((c) => c.id === categoryId);
                if (!category) return null;
                return (
                  <Badge
                    key={categoryId}
                    variant="secondary"
                    className="flex items-center gap-1 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => {
                      setSelectedCategories(
                        selectedCategories.filter((id) => id !== categoryId)
                      );
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                );
              })}

              {/* Label Filter Badges */}
              {selectedLabels.map((labelId) => {
                const label = labels.find((l) => l.id === labelId);
                if (!label) return null;
                return (
                  <Badge
                    key={labelId}
                    variant="secondary"
                    className="flex items-center gap-1 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => {
                      setSelectedLabels(
                        selectedLabels.filter((id) => id !== labelId)
                      );
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: label.color }}
                    />
                    {label.name}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Tasks Section */}
      {tasksLoading ? (
        <div className="flex justify-center items-center min-h-[200px] mt-8">
          <Spinner />
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12 mt-8">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-primary mb-2">
            No tasks yet
          </h3>
          <p className="text-gray-500 mb-4">
            Create your first task to get started!
          </p>
          <ActionButton size="sm" onClick={createTask} loading={isLoading}>
            <Plus size={16} /> Create Task
          </ActionButton>
        </div>
      ) : (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-400">
              {filteredTasks.length === tasks.length
                ? `All Tasks (${tasks.length})`
                : `Filtered Tasks (${filteredTasks.length} of ${tasks.length})`}
            </h2>
          </div>

          {/* Filtered Tasks Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>

          {filteredTasks.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">
                No tasks match your current filters.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="mt-2"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
            <DialogDescription>
              Fill in the details below to create a new task.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <CreateTask
              onSuccess={() => {
                setIsDialogOpen(false);
                if (user) {
                  getLoggedInUserAllTasks(user.id).then((result) => {
                    if (result.success) {
                      setTasks(result.tasks || []);
                    }
                  });
                }
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update the task details below.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {editingTask && (
              <EditTask
                task={editingTask}
                onSuccess={() => {
                  setIsEditDialogOpen(false);
                  setEditingTask(null);
                  if (user) {
                    getLoggedInUserAllTasks(user.id).then((result) => {
                      if (result.success) {
                        setTasks(result.tasks || []);
                      }
                    });
                  }
                }}
                onCancel={() => {
                  setIsEditDialogOpen(false);
                  setEditingTask(null);
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
