"use client";
import { useEffect, useRef, useState } from "react";
export function LeadMessage({ message }: { message: string }) {
  const text = useRef<HTMLSpanElement>(null);
  const [clamped, setClamped] = useState(false);
  useEffect(() => {
    const element = text.current;
    if (!element) return;
    const measure = () => setClamped(element.scrollHeight > element.clientHeight + 1);
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    void document.fonts.ready.then(measure);
    return () => observer.disconnect();
  }, [message]);
  return <span className="compact-message"><span ref={text} className="message message-preview">{message}</span>{clamped && <span className="read-message-hint">Read full message</span>}</span>;
}
