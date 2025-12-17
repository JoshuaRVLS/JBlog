import * as React from "react";
import { cn } from "@/lib/utils";

interface FormInputProps extends React.ComponentProps<"input"> {
  label?: string;
  required?: boolean;
  error?: string;
}

interface FormTextareaProps extends React.ComponentProps<"textarea"> {
  label?: string;
  required?: boolean;
  error?: string;
}

interface FormSelectProps extends React.ComponentProps<"select"> {
  label?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

const baseInputClasses = "w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all";

export function FormInput({ 
  label, 
  required, 
  error, 
  className, 
  id,
  ...props 
}: FormInputProps) {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);
  
  return (
    <div className="space-y-2">
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-semibold text-foreground"
        >
          {label} {required && <span className="text-destructive">*</span>}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          baseInputClasses,
          error && "border-destructive focus:ring-destructive",
          className
        )}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function FormTextarea({ 
  label, 
  required, 
  error, 
  className, 
  id,
  ...props 
}: FormTextareaProps) {
  const inputId = id || (label ? `textarea-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);
  
  return (
    <div className="space-y-2">
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-semibold text-foreground"
        >
          {label} {required && <span className="text-destructive">*</span>}
        </label>
      )}
      <textarea
        id={inputId}
        className={cn(
          baseInputClasses,
          "resize-none",
          error && "border-destructive focus:ring-destructive",
          className
        )}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function FormSelect({ 
  label, 
  required, 
  error, 
  className, 
  id,
  children,
  ...props 
}: FormSelectProps) {
  const inputId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);
  
  return (
    <div className="space-y-2">
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-semibold text-foreground"
        >
          {label} {required && <span className="text-destructive">*</span>}
        </label>
      )}
      <select
        id={inputId}
        className={cn(
          baseInputClasses,
          error && "border-destructive focus:ring-destructive",
          className
        )}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p id={`${inputId}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

