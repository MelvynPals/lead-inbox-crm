"use client";
import { useSyncExternalStore } from "react";
function subscribe(refresh: () => void) {
  const timer = setInterval(refresh, 60000);
  return () => clearInterval(timer);
}
export function LeadTime({ value }: { value: string }) {
  const minute = useSyncExternalStore<number | null>(subscribe, () => Math.floor(Date.now() / 60000), () => null);
  if (minute === null) return <time className="lead-time" dateTime={value}>Loading local time...</time>;
  const date = new Date(value);
  const elapsed = Math.max(0, minute * 60000 - date.getTime());
  const minutes = Math.floor(elapsed / 60000);
  const relative = minutes < 1 ? "Just now" : minutes < 60 ? `${minutes}m ago` : minutes < 1440 ? `${Math.floor(minutes / 60)}h ago` : `${Math.floor(minutes / 1440)}d ago`;
  const full = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
  const zone = new Intl.DateTimeFormat(undefined, { timeZoneName: "short" }).formatToParts(date).find(part => part.type === "timeZoneName")?.value;
  return <time className="lead-time" dateTime={value} title={`${full} ${zone}`}><span>{relative}</span><span>{full} {zone}</span></time>;
}
