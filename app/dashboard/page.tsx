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
} from "lucide-react";
import {
  getLoggedInUserAllTasks,
  completeTask,
  deleteTask,
} from "@/app/action/task";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "completed" | "incomplete">(
    "all"
  );
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await authClient.getSession();
        if (!session.data?.user) {
          router.push("/login");
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
    const fetchTasks = async () => {
      if (!user) return;

      setTasksLoading(true);
      try {
        const result = await getLoggedInUserAllTasks(user.id);
        if (result.success) {
          setTasks(result.tasks || []);
        } else {
          toast.error("Failed to fetch tasks");
        }
      } catch (error) {
        console.error("Error fetching tasks:", error);
        toast.error("Something went wrong");
      } finally {
        setTasksLoading(false);
      }
    };

    fetchTasks();
  }, [user]);

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
        throw new Error("Failed to check subscription");
      }

      const data = await response.json();

      if (!data.hasActiveSubscription) {
        router.push("/choose-plan");
        return;
      }

      // Open create task dialog when user has active subscription
      setIsDialogOpen(true);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const completedTasks = tasks.filter((task) => task.isCompleted);
  const incompleteTasks = tasks.filter((task) => !task.isCompleted);

  const filteredTasks = tasks.filter((task) => {
    if (filter === "completed") return task.isCompleted;
    if (filter === "incomplete") return !task.isCompleted;
    return true; // "all"
  });

  const handleCompleteTask = async (taskId: string) => {
    if (!user) return;

    setActionLoading(taskId);
    try {
      const result = await completeTask(taskId, user.id);
      if (result.success) {
        // Refresh tasks to get updated state
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
        // Refresh tasks to get updated state
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

  const handleEditTask = (task: any) => {
    setEditingTask(task);
    setIsEditDialogOpen(true);
  };

  const TaskCard = ({ task }: { task: any }) => (
    <Card className="hover:shadow-md transition-shadow border-dashed  bg-transparent">
      <CardContent className="">
        <div className="flex justify-between items-start">
          <div className="flex flex-col  items-start  mb-2">
            <div className="flex text-xs text-muted-foreground mb-1">
              <span>{new Date(task.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              {task.isCompleted ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <Circle className="w-5 h-5 text-gray-400" />
              )}
              <h3
                className={`font-medium ${
                  task.isCompleted
                    ? "text-primary line-through"
                    : "text-primary"
                }`}
              >
                {task.title}
              </h3>
            </div>
          </div>

          {/* Task Actions Dropdown */}
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
            className={`text-sm mb-3 ${
              task.isCompleted ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-xs text-gray-500">
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

  return (
    <div className="p-10">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <ActionButton size="sm" onClick={createTask} loading={isLoading}>
          <Plus size={16} />{" "}
          <span className="hidden sm:inline">Create Task</span>
        </ActionButton>
      </div>

      {/* Task Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Card className="backdrop-blur-md bg-white/10 border-white/20 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary">Total Tasks</p>
                <p className="text-2xl font-bold text-blue-300">
                  {tasks.length}
                </p>
              </div>
              <div className="bg-blue-500/20 p-3 rounded-full backdrop-blur-sm border border-blue-400/30">
                <Calendar className="w-6 h-6 text-blue-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-md bg-white/10 border-white/20 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary">Completed</p>
                <p className="text-2xl font-bold text-green-400">
                  {completedTasks.length}
                </p>
              </div>
              <div className="bg-green-500/20 p-3 rounded-full backdrop-blur-sm border border-green-400/30">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-md bg-white/10 border-white/20 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary">Incomplete</p>
                <p className="text-2xl font-bold text-orange-400">
                  {incompleteTasks.length}
                </p>
              </div>
              <div className="bg-orange-500/20 p-3 rounded-full backdrop-blur-sm border border-orange-400/30">
                <Circle className="w-6 h-6 text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
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
            <h2 className="text-lg font-semibold text-gray-400">My Tasks</h2>

            {/* Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-600 transition-colors">
                  <Filter className="w-4 h-4" />
                  <span>
                    {filter === "all"
                      ? "All"
                      : filter === "completed"
                      ? "Completed"
                      : "Incomplete"}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => setFilter("all")}
                  className={
                    filter === "all"
                      ? "bg-gray-50 font-medium text-blue-500"
                      : "text-primary"
                  }
                >
                  All ({tasks.length})
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setFilter("incomplete")}
                  className={
                    filter === "incomplete"
                      ? "bg-gray-50 font-medium text-orange-600"
                      : "text-primary"
                  }
                >
                  Incomplete ({incompleteTasks.length})
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setFilter("completed")}
                  className={
                    filter === "completed"
                      ? "bg-gray-50 font-medium text-green-600"
                      : "text-primary"
                  }
                >
                  Completed ({completedTasks.length})
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                No{" "}
                {filter === "completed"
                  ? "completed"
                  : filter === "incomplete"
                  ? "incomplete"
                  : ""}{" "}
                tasks found.
              </p>
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
                // Refresh tasks after creating a new one
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
                  // Refresh tasks after editing
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
