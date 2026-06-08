"use client";

import { useMounted } from "@/lib/use-mounted";

function formatTimeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "щойно";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} хв тому`;
  const hours = Math.floor(minutes / 60);
  return `${hours} год тому`;
}

export default function TimeAgo({ date }: { date: string }) {
  const mounted = useMounted();
  if (!mounted) return <span className="text-[10px] text-party-cream/40">…</span>;
  return (
    <span className="text-[10px] text-party-cream/40">{formatTimeAgo(date)}</span>
  );
}
