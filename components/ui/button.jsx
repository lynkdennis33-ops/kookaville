import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { Slot } from "@radix-ui/react-slot";

export const Button = React.forwardRef(
  (
    {
      className,
      variant = "default",
      size = "default",
      isLoading,
      leftIcon,
      rightIcon,
      children,
      disabled,
      asChild = false,
      ...props
    },
    ref,
  ) => {
    const variants = {
      default:
        "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
      primary: "bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      outline:
        "border border-border bg-transparent hover:bg-secondary text-foreground",
      ghost:
        "hover:bg-secondary hover:text-secondary-foreground text-foreground",
      link: "text-primary underline-offset-4 hover:underline",
      danger: "bg-red-500 text-white hover:bg-red-600",
    };

    const sizes = {
      default: "h-11 px-4 py-2",
      sm: "h-9 px-3 text-xs",
      lg: "h-14 px-8 text-lg rounded-xl",
      icon: "h-10 w-10",
    };

    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
          variants[variant],
          sizes[size],
          className,
        )}
        disabled={isLoading || disabled}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
            {children}
            {!isLoading && rightIcon && (
              <span className="ml-2">{rightIcon}</span>
            )}
          </>
        )}
      </Comp>
    );
  },
);

Button.displayName = "Button";
