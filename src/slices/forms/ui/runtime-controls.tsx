import type { ComponentProps, ReactNode } from "react";
import { FormCheckbox, FormField, FormInput, FormTextarea, buttonClassName, cn } from "@core/ui";

/** Neutral controls shared by staff preview and public Forms. No Backoffice dependency. */
export const TextInput = FormInput;
export const TextArea = FormTextarea;
export const Field = FormField;
export function Select({ children, className, ...props }: ComponentProps<"select">) {
  return <select {...props} className={cn("w-full min-w-0 rounded border border-line bg-bg px-3.5 py-3 text-[15px] text-ink focus:border-accent focus:outline-none disabled:opacity-60", className)}>{children}</select>;
}
export function Checkbox({ label, ...props }: Omit<ComponentProps<"input">, "type"> & { label: string }) {
  return <FormCheckbox {...props}>{label}</FormCheckbox>;
}
export function RuntimeButton({ variant, className, type = "button", children, ...props }: ComponentProps<"button"> & { variant?: "primary" | "ghost"; children: ReactNode }) {
  return <button {...props} type={type} className={cn(buttonClassName(variant === "primary" ? "primary" : "outline", undefined, "sm"), "disabled:cursor-not-allowed disabled:opacity-60", className)}>{children}</button>;
}
