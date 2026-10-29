import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  CheckCircle2Icon,
  InboxIcon,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const widths = {
  sm: "max-w-xl",
  md: "max-w-3xl",
  lg: "max-w-5xl",
  xl: "max-w-6xl",
};

export function PageShell({
  children,
  width = "lg",
}: {
  children: ReactNode;
  width?: keyof typeof widths;
}) {
  return (
    <main
      className={cn(
        "mx-auto flex w-full flex-col gap-6 p-4 sm:p-6",
        widths[width]
      )}
    >
      {children}
    </main>
  );
}

export function PageHeader({
  title,
  description,
  backHref,
  backLabel = "Back to dashboard",
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      {backHref && (
        <Link
          href={backHref}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "self-start"
          )}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          {backLabel}
        </Link>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
    </div>
  );
}

export function ErrorAlert({
  message,
  title = "Something went wrong",
}: {
  message: string;
  title?: string;
}) {
  if (!message) return null;

  return (
    <Alert variant="destructive" role="alert">
      <AlertCircleIcon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

export function SuccessAlert({ message }: { message: string }) {
  if (!message) return null;

  return (
    <Alert role="status">
      <CheckCircle2Icon />
      <AlertTitle>{message}</AlertTitle>
    </Alert>
  );
}

export function LoadingState({
  label = "Loading...",
  rows = 3,
}: {
  label?: string;
  rows?: number;
}) {
  return (
    <div role="status" className="flex flex-col gap-3">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <InboxIcon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {children}
    </Empty>
  );
}

const statusVariants: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  Present: "default",
  Open: "default",
  OPEN: "default",
  Absent: "destructive",
  Expired: "destructive",
  Closed: "secondary",
  CLOSED: "secondary",
  Scheduled: "secondary",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={statusVariants[status] ?? "outline"}>{status}</Badge>
  );
}
