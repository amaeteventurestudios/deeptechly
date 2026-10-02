import "server-only";

import { getInviteCodeStatus, listInviteCodes } from "@/lib/admin/invite-codes";
import { listAllContent } from "@/lib/admin/content";
import { listAllUsers, type AdminUserRow } from "@/lib/admin/users";
import type {
  ActivityChartPoint,
  PipelineChartPoint
} from "@/components/admin/AdminOverviewCharts";

export type AdminMetric = {
  label: string;
  value: string;
  detail: string;
};

export type AdminOverviewData = {
  metrics: AdminMetric[];
  pipeline: PipelineChartPoint[];
  activity: ActivityChartPoint[];
  activityWindow: 7 | 30 | 90;
  inviteRedemptionsStored: boolean;
  pendingReviews:
    | { status: "ok"; users: AdminUserRow[] }
    | { status: "not_stored"; message: string };
  recentActivity: { status: "not_stored"; message: string };
};

type OverviewInput = {
  windowDays?: number;
};

export async function getAdminOverviewData({
  windowDays = 30
}: OverviewInput = {}): Promise<AdminOverviewData> {
  const activityWindow = normalizeWindow(windowDays);
  const [usersResult, inviteCodesResult, contentResult] = await Promise.all([
    listAllUsers(),
    listInviteCodes(),
    readContentSafely()
  ]);

  const users = usersResult.ok ? usersResult.users : null;
  const inviteCodes = inviteCodesResult.ok ? inviteCodesResult.inviteCodes : null;
  const contentRows = contentResult.ok ? contentResult.rows : null;

  const pendingReviews = users
    ? {
        status: "ok" as const,
        users: users
          .filter((user) => user.institutionalRequestPending)
          .slice(0, 6)
      }
    : {
        status: "not_stored" as const,
        message: "Pending review flag: Not stored"
      };

  return {
    metrics: [
      {
        label: "Total Users",
        value: users ? String(users.length) : "Not stored",
        detail: "Registered profiles"
      },
      {
        label: "Institutional Users",
        value: users
          ? String(users.filter((user) => user.isInstitutionalVerified).length)
          : "Not stored",
        detail: "Verified accounts"
      },
      {
        label: "Pending Reviews",
        value: users
          ? String(users.filter((user) => user.institutionalRequestPending).length)
          : "Not stored",
        detail: "Institutional requests"
      },
      {
        label: "Active Invite Codes",
        value: inviteCodes
          ? String(inviteCodes.filter((code) => getInviteCodeStatus(code).isActive).length)
          : "Not stored",
        detail: "Redeemable codes"
      },
      {
        label: "Published Articles",
        value: contentRows
          ? String(
              contentRows.filter((row) => row.publishedStatus === "published")
                .length
            )
          : "Not stored",
        detail: "Live public content"
      },
      {
        label: "Draft / Review Items",
        value: contentRows
          ? String(
              contentRows.filter(
                (row) =>
                  row.publishedStatus === "draft" ||
                  !["done", "public_research_ready", "failed", "cancelled"].includes(
                    row.stage
                  )
              ).length
            )
          : "Not stored",
        detail: "Unpublished or active"
      },
      {
        label: "Failed Research Jobs",
        value: contentRows
          ? String(contentRows.filter((row) => row.stage === "failed").length)
          : "Not stored",
        detail: "Needs attention"
      }
    ],
    pipeline: buildPipelineChart(contentRows),
    activity: buildUserActivity(users, activityWindow),
    activityWindow,
    inviteRedemptionsStored: false,
    pendingReviews,
    recentActivity: {
      status: "not_stored",
      message: "Admin activity log: Not stored"
    }
  };
}

async function readContentSafely() {
  try {
    return { ok: true as const, rows: await listAllContent() };
  } catch (error) {
    console.error("Admin overview content metrics unavailable", error);
    return { ok: false as const };
  }
}

function buildPipelineChart(
  rows: Awaited<ReturnType<typeof listAllContent>> | null
): PipelineChartPoint[] {
  const buckets = {
    Queued: 0,
    Running: 0,
    Failed: 0,
    "Published / Done": 0
  };

  rows?.forEach((row) => {
    if (row.stage === "queued") {
      buckets.Queued += 1;
      return;
    }

    if (row.stage === "failed" || row.stage === "cancelled") {
      buckets.Failed += 1;
      return;
    }

    if (
      row.stage === "done" ||
      row.stage === "public_research_ready" ||
      row.publishedStatus === "published"
    ) {
      buckets["Published / Done"] += 1;
      return;
    }

    buckets.Running += 1;
  });

  return Object.entries(buckets).map(([name, value]) => ({ name, value }));
}

function buildUserActivity(
  users: AdminUserRow[] | null,
  windowDays: 7 | 30 | 90
): ActivityChartPoint[] {
  const today = startOfDay(new Date());
  const points = new Map<string, ActivityChartPoint>();

  for (let offset = windowDays - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const key = dateKey(date);
    points.set(key, {
      date: shortDateLabel(date),
      newUsers: 0,
      institutionalUsers: 0
    });
  }

  users?.forEach((user) => {
    const createdAt = new Date(user.createdAt);
    if (Number.isNaN(createdAt.getTime())) return;

    const key = dateKey(createdAt);
    const point = points.get(key);
    if (!point) return;

    point.newUsers += 1;
    if (user.isInstitutionalVerified) {
      point.institutionalUsers += 1;
    }
  });

  return Array.from(points.values());
}

function normalizeWindow(value: number): 7 | 30 | 90 {
  if (value === 7 || value === 90) return value;
  return 30;
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function dateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function shortDateLabel(value: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric"
  }).format(value);
}
