/**
 * Shared types for data that crosses the network boundary.
 *
 * Route Handlers serialise Prisma records with `NextResponse.json`, so every
 * `DateTime` arrives on the client as an ISO string - not a `Date`. These
 * interfaces describe that post-serialisation shape, which is why dates are
 * typed `string` rather than `Date`.
 *
 * Keep these in sync with the route handlers that produce them. The Prisma
 * schema is the source of truth for the database shape; these types describe the
 * JSON the client actually receives.
 */

export interface Category {
  id: string;
  name: string;
  color: string;
  description: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * A task-to-label join row, including its label.
 *
 * Note the API contract: task routes rename `taskLabels` to `labels` on the way
 * out, but the *elements* are still join rows (with `taskId`/`labelId`), not
 * bare labels. See `app/api/tasks/route.ts`.
 */
export interface TaskLabel {
  id: string;
  taskId: string;
  labelId: string;
  createdAt: string;
  label: Label | null;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  /** ISO string; nullable only on records created before the field was required. */
  dueDate: string | null;
  /** PRO-only. Always null for FREE subscribers. */
  reminderDate: string | null;
  /** PRO-only. Always null for FREE subscribers. */
  categoryId: string | null;
  category: Category | null;
  isCompleted: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
  /** Populated by the task routes, which rename `taskLabels` on serialisation. */
  labels?: TaskLabel[];
  taskLabels?: TaskLabel[];
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  /** Price in cents. */
  price: number;
  /** Task cap. `-1` means unlimited. */
  maxTasks: number;
  features: Record<string, boolean>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  plan: SubscriptionPlan;
}

/**
 * The Better Auth session user.
 *
 * Mirrors the shape returned by `authClient.getSession()`, including the
 * `createdAt`/`updatedAt` fields Better Auth ships on every user record.
 */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  stripeCustomerId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** FREE-tier summary returned by `GET /api/tasks/summary`. */
export interface TaskSummary {
  totalTasks: number;
  completedTasks: number;
  incompleteTasks: number;
  completionRate: number;
  tasksDueThisWeek: number;
  overdueTasks: number;
}

/** PRO-tier analytics returned by `GET /api/analytics`. */
export interface Analytics {
  summary: TaskSummary & {
    tasksCreatedLast30Days: number;
    tasksCompletedLast30Days: number;
    mostProductiveDay?: string;
    averageTasksPerDay?: string;
    currentStreak?: string;
  };
  categories: Array<{
    name: string;
    color: string;
    total: number;
    completed: number;
  }>;
  labels: Array<{
    name: string;
    color: string;
    count: number;
  }>;
  completionTrend: Array<{
    date: string;
    completed: number;
  }>;
}

/**
 * The session user enriched with OAuth capability flags.
 *
 * Returned by the `getUserWithOAuth` server action in `app/action/user.ts`,
 * which checks whether the account has linked OAuth providers, a password
 * credential, or both.
 */
export interface UserWithOAuth extends SessionUser {
  hasOAuthAccounts: boolean;
  hasPasswordCredentials: boolean;
  isOAuthOnly: boolean;
}

/* ------------------------------------------------------------------ */
/* API response envelopes                                             */
/* ------------------------------------------------------------------ */

export interface TasksResponse {
  tasks: Task[];
}

export interface CategoriesResponse {
  categories: Category[];
}

export interface LabelsResponse {
  labels: Label[];
}

export interface CurrentSubscriptionResponse {
  currentSubscription: UserSubscription | null;
  hasActiveSubscription: boolean;
}

export interface SubscriptionHistoryResponse {
  success: boolean;
  subscriptions: UserSubscription[];
  error?: string;
}

export interface AnalyticsResponse {
  analytics: Analytics;
}
