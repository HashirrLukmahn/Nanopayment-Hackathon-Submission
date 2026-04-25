"use client";

import { useEffect, useState } from "react";
import { listResearchers, getEarnings, type EarningsResponse, type Researcher } from "@/lib/api";
import { Card, CardBody, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { formatUsdc, truncateAddress } from "@/lib/format";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";

const TIER_COLOR: Record<string, string> = {
  open: "hsl(45 55% 65%)",
  validated: "hsl(35 70% 55%)",
  dark: "hsl(20 80% 50%)",
};

export function ResearcherEarnings() {
  const [researchers, setResearchers] = useState<Researcher[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [earnings, setEarnings] = useState<EarningsResponse | null>(null);

  useEffect(() => {
    listResearchers().then(({ researchers }) => {
      setResearchers(researchers);
      if (researchers[0]) setSelectedId(researchers[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    getEarnings(selectedId).then(setEarnings);
  }, [selectedId]);

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Researchers</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          <ul className="divide-y divide-border">
            {researchers.map((r) => (
              <li key={r.id}>
                <button
                  onClick={() => setSelectedId(r.id)}
                  className={
                    "w-full px-5 py-3 text-left hover:bg-muted/30 transition " +
                    (selectedId === r.id ? "bg-muted/40" : "")
                  }
                >
                  <div className="text-sm font-medium text-foreground">{r.displayName}</div>
                  <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                    {truncateAddress(r.walletAddress)}
                  </div>
                </button>
              </li>
            ))}
            {researchers.length === 0 && (
              <li className="px-5 py-6 text-sm text-muted-foreground">No researchers yet — run the seed script.</li>
            )}
          </ul>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{earnings?.displayName ?? "—"}</CardTitle>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                {earnings ? truncateAddress(earnings.walletAddress) : ""}
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Total Earnings</div>
              <div className="font-mono text-2xl text-accent tabular-nums">
                {formatUsdc(earnings?.totalEarningsUsdc ?? "0")}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-6">
          {earnings && earnings.uploads.length > 0 ? (
            <>
              <div className="h-56 -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={earnings.uploads.map((u) => ({
                    name: u.title.length > 24 ? u.title.slice(0, 22) + "…" : u.title,
                    earnings: parseFloat(u.earningsUsdc),
                    tier: u.tier,
                  }))}>
                    <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 6,
                        fontSize: 12,
                      }}
                      formatter={(v: number) => [formatUsdc(v, 4), "earnings"]}
                    />
                    <Bar dataKey="earnings" radius={[3, 3, 0, 0]}>
                      {earnings.uploads.map((u) => (
                        <Cell key={u.uploadId} fill={TIER_COLOR[u.tier] ?? TIER_COLOR.open} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                      <th className="pb-2 font-normal">Upload</th>
                      <th className="pb-2 font-normal">Tier</th>
                      <th className="pb-2 font-normal text-right">Retrievals</th>
                      <th className="pb-2 font-normal text-right">Earnings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {earnings.uploads.map((u) => (
                      <tr key={u.uploadId}>
                        <td className="py-3 pr-4">{u.title}</td>
                        <td className="py-3 pr-4"><Badge variant={u.tier === "dark" ? "warning" : u.tier === "validated" ? "accent" : "default"}>{u.tier}</Badge></td>
                        <td className="py-3 pr-4 text-right font-mono tabular-nums">{u.retrievalCount}</td>
                        <td className="py-3 text-right font-mono tabular-nums text-accent">{formatUsdc(u.earningsUsdc, 4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No earnings yet. Run the demo to generate retrievals.
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
