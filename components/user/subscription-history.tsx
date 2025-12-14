"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  maxTasks: number;
  features: any;
}

interface UserSubscription {
  id: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  plan: SubscriptionPlan;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
}

export default function SubscriptionHistory() {
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscriptionHistory = async () => {
      try {
        const response = await fetch("/api/subscription/history");
        const data = await response.json();

        if (data.success) {
          setSubscriptions(data.subscriptions);
        } else {
          setError(data.error || "Failed to fetch subscription history");
        }
      } catch (err) {
        setError("Failed to fetch subscription history");
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionHistory();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "expired":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price / 100);
  };

  const columns: ColumnDef<UserSubscription>[] = [
    {
      accessorKey: "name",
      header: "Plan",
      cell: ({ row }) => {
        return <div className="font-medium">{row.original.plan.name}</div>;
      },
      filterFn: (row, columnId, filterValue) => {
        return row.original.plan.name
          .toLowerCase()
          .includes(filterValue.toLowerCase());
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge className={getStatusColor(status)}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "plan.price",
      header: "Price",
      cell: ({ row }) => {
        const price = row.original.plan.price;
        return <div>{formatPrice(price)}</div>;
      },
    },
    {
      accessorKey: "plan.maxTasks",
      header: "Max Tasks",
      cell: ({ row }) => {
        const maxTasks = row.original.plan.maxTasks;
        return <div>{maxTasks === -1 ? "Unlimited" : maxTasks}</div>;
      },
    },
    {
      accessorKey: "currentPeriodStart",
      header: "Started",
      cell: ({ row }) => {
        return <div>{formatDate(row.getValue("currentPeriodStart"))}</div>;
      },
    },
    {
      accessorKey: "currentPeriodEnd",
      header: "Ends",
      cell: ({ row }) => {
        return <div>{formatDate(row.getValue("currentPeriodEnd"))}</div>;
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => {
        return (
          <div className="text-muted-foreground">
            {formatDate(row.getValue("createdAt"))}
          </div>
        );
      },
    },
    {
      accessorKey: "cancelledAt",
      header: "Cancelled",
      cell: ({ row }) => {
        const cancelledAt = row.original.cancelledAt;
        return cancelledAt ? (
          <div className="text-muted-foreground">{formatDate(cancelledAt)}</div>
        ) : (
          <div className="text-muted-foreground">-</div>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No subscription history found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={subscriptions}
        searchKey="name"
        searchPlaceholder="Filter by plan name..."
      />
    </div>
  );
}
