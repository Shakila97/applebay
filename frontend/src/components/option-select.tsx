"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Option = {
  value: string;
  label: string;
};

// Single-choice select whose empty value is "" (matching the page state),
// with a placeholder row for "nothing chosen".
export function OptionSelect({
  id,
  options,
  value,
  onChange,
  placeholder,
  disabled,
  required,
}: {
  id: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  required?: boolean;
}) {
  const items = [
    { label: placeholder, value: null as string | null },
    ...options,
  ];

  return (
    <Select
      items={items}
      required={required}
      disabled={disabled}
      value={value || null}
      onValueChange={(next) => onChange(next ?? "")}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {items.map((item) => (
            <SelectItem key={item.value ?? ""} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
