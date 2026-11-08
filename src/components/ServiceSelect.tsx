"use client";

import { useState, useSyncExternalStore } from "react";
import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { services } from "@/src/lib/types";

const desktopQuery = "(min-width: 761px) and (pointer: fine)";
function subscribe(listener: () => void) {
  const media = window.matchMedia(desktopQuery);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}

export function ServiceSelect({ error }: { error?: string }) {
  const [value, setValue] = useState("");
  const desktop = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(desktopQuery).matches,
    () => false,
  );
  const accessibility = {
    id: "service",
    "aria-invalid": !!error,
    "aria-describedby": error ? "service-error" : undefined,
  };

  return (
    <div className="field">
      <label htmlFor="service">Service</label>
      {desktop ? (
        <Select.Root name="service" value={value} onValueChange={setValue} required>
          <Select.Trigger {...accessibility} className="select-trigger">
            <Select.Value placeholder="Choose a service" />
            <Select.Icon className="select-icon" asChild>
              <ChevronDown size={18} aria-hidden="true" />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content className="select-content" position="popper" sideOffset={6} collisionPadding={16}>
              <Select.Viewport>
                {services.map(service => (
                  <Select.Item className="select-option" key={service} value={service}>
                    <Select.ItemText>{service[0].toUpperCase() + service.slice(1)}</Select.ItemText>
                    <Select.ItemIndicator asChild>
                      <Check size={16} aria-hidden="true" />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      ) : (
        <select {...accessibility} name="service" value={value} onChange={event => setValue(event.target.value)} required>
          <option value="" disabled>Choose a service</option>
          {services.map(service => <option key={service} value={service}>{service[0].toUpperCase() + service.slice(1)}</option>)}
        </select>
      )}
      {error && <p id="service-error" className="error">{error}</p>}
    </div>
  );
}
