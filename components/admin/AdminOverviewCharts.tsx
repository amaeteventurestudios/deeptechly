"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

export type PipelineChartPoint = {
  name: string;
  value: number;
};

export type ActivityChartPoint = {
  date: string;
  newUsers: number;
  institutionalUsers: number;
};

export function ResearchPipelineChart({
  data
}: {
  data: PipelineChartPoint[];
}) {
  const total = data.reduce((sum, point) => sum + point.value, 0);

  if (total === 0) {
    return <ChartEmptyState message="Not enough activity data yet." />;
  }

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer height="100%" width="100%">
        <BarChart data={data} margin={{ bottom: 6, left: -18, right: 8, top: 8 }}>
          <CartesianGrid stroke="#1f1f1f" strokeOpacity={0.12} vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: "#1f1f1f", fontSize: 10, fontWeight: 800 }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "#56534d", fontSize: 10, fontWeight: 800 }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#fffaf0",
              border: "1px solid #000",
              borderRadius: 0,
              color: "#1f1f1f",
              fontSize: 12,
              fontWeight: 800
            }}
            cursor={{ fill: "rgba(255, 106, 0, 0.12)" }}
          />
          <Bar dataKey="value" fill="#ff6a00" stroke="#000" strokeWidth={1} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function UserInviteActivityChart({
  data
}: {
  data: ActivityChartPoint[];
}) {
  const total = data.reduce(
    (sum, point) => sum + point.newUsers + point.institutionalUsers,
    0
  );

  if (total === 0) {
    return <ChartEmptyState message="Not enough activity data yet." />;
  }

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer height="100%" width="100%">
        <LineChart data={data} margin={{ bottom: 6, left: -18, right: 8, top: 8 }}>
          <CartesianGrid stroke="#1f1f1f" strokeOpacity={0.12} vertical={false} />
          <XAxis
            dataKey="date"
            minTickGap={18}
            tick={{ fill: "#1f1f1f", fontSize: 10, fontWeight: 800 }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "#56534d", fontSize: 10, fontWeight: 800 }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#fffaf0",
              border: "1px solid #000",
              borderRadius: 0,
              color: "#1f1f1f",
              fontSize: 12,
              fontWeight: 800
            }}
          />
          <Line
            dataKey="newUsers"
            name="New users"
            stroke="#ff6a00"
            strokeWidth={3}
            dot={{ fill: "#ff6a00", r: 3, stroke: "#000", strokeWidth: 1 }}
            type="monotone"
          />
          <Line
            dataKey="institutionalUsers"
            name="Institutional users"
            stroke="#1f1f1f"
            strokeWidth={2}
            dot={{ fill: "#1f1f1f", r: 3, stroke: "#000", strokeWidth: 1 }}
            type="monotone"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartEmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[260px] items-center justify-center border border-black bg-offWhite p-5 text-center">
      <p className="max-w-xs text-[10px] font-black uppercase tracking-[0.16em] text-muted">
        {message}
      </p>
    </div>
  );
}
