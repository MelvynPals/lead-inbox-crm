"use client";
import { useState, useId } from "react";
export function LeadMessage({ message }: { message: string }) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  return <div><p id={id} className={`message${expanded ? "" : " message-preview"}`}>{message}</p><button type="button" className="text-button" aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded(!expanded)}>{expanded ? "Show less" : "Read full message"}</button></div>;
}
