import * as React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", ...props }, ref) => {
    let baseStyle = "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 rounded-md text-sm";
    
    let variantStyle = "bg-slate-900 text-white hover:bg-slate-800";
    if (variant === "outline") variantStyle = "border border-slate-200 bg-white hover:bg-slate-100 text-slate-900";
    else if (variant === "ghost") variantStyle = "hover:bg-slate-100 text-slate-700";
    else if (variant === "destructive") variantStyle = "bg-red-600 text-white hover:bg-red-700";
    else if (variant === "secondary") variantStyle = "bg-slate-100 text-slate-900 hover:bg-slate-200";

    let sizeStyle = "h-10 px-4 py-2";
    if (size === "sm") sizeStyle = "h-8 px-3 text-xs";
    else if (size === "lg") sizeStyle = "h-12 px-8";
    else if (size === "icon") sizeStyle = "h-9 w-9 p-0";

    return (
      <button
        ref={ref}
        className={`${baseStyle} ${variantStyle} ${sizeStyle} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
