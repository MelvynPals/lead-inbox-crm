"use client";

import { useState, useSyncExternalStore } from "react";
import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";

const desktopQuery = "(min-width: 761px) and (pointer: fine)";
function subscribe(listener: () => void) {
  const media = window.matchMedia(desktopQuery);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}

type Props = {
  id: string;
  name: string;
  label: string;
  options: readonly string[];
  emptyLabel?: string;
  defaultValue?: string;
  required?: boolean;
  error?: string;
};

export function ResponsiveSelect({ id, name, label, options, emptyLabel, defaultValue = "", required = false, error }: Props) {
  const [value, setValue] = useState(defaultValue);
  const desktop = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(desktopQuery).matches,
    () => false,
  );
  const accessibility = {
    id,
    "aria-invalid": !!error,
    "aria-describedby": error ? `${id}-error` : undefined,
  };

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {desktop && <input type="hidden" name={name} value={value} />}
      {desktop ? (
        <Select.Root value={value || (required || !emptyLabel ? "" : "__all__")} onValueChange={next => setValue(next === "__all__" ? "" : next)} required={required}>
          <Select.Trigger {...accessibility} className="select-trigger">
            <Select.Value placeholder={emptyLabel} />
            <Select.Icon className="select-icon" asChild>
              <ChevronDown size={18} aria-hidden="true" />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content className="select-content" position="popper" sideOffset={6} collisionPadding={16}>
              <Select.Viewport>
                {!required && emptyLabel && (
                  <Select.Item className="select-option" value="__all__">
                    <Select.ItemText>{emptyLabel}</Select.ItemText>
                    <Select.ItemIndicator asChild><Check size={16} aria-hidden="true" /></Select.ItemIndicator>
                  </Select.Item>
                )}
                {options.map(option => (
                  <Select.Item className="select-option" key={option} value={option}>
                    <Select.ItemText>{option[0].toUpperCase() + option.slice(1)}</Select.ItemText>
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
        <select {...accessibility} name={name} value={value} onChange={event => setValue(event.target.value)} required={required}>
          {emptyLabel && <option value="" disabled={required}>{emptyLabel}</option>}
          {options.map(option => <option key={option} value={option}>{option[0].toUpperCase() + option.slice(1)}</option>)}
        </select>
      )}
      {error && <p id={`${id}-error`} className="error">{error}</p>}
    </div>
  );
}
