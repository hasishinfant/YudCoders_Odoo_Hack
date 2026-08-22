import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline";
}

export function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  let style = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2";
  if (variant === "secondary") style += " bg-slate-100 text-slate-900 hover:bg-slate-200";
  else if (variant === "destructive") style += " bg-red-600 text-white hover:bg-red-700";
  else if (variant === "outline") style += " text-slate-950 border border-slate-200";
  else style += " bg-slate-900 text-white hover:bg-slate-800";

  return <div className={`${style} ${className}`} {...props} />;
}
