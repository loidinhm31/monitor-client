import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@repo/ui/lib/utils";

const textareaVariants = cva(
  "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  {
    variants: {
      variant: {
        default: "",
        holographic: [
          "bg-black/20 border-cyan-400/30 text-cyan-400",
          "placeholder:text-cyan-400/50",
          "focus:border-cyan-400/60 focus:shadow-cyan-400/20 focus:shadow-md",
          "font-mono resize-none",
        ],
        "holographic-secondary": [
          "bg-black/20 border-slate-400/30 text-slate-400",
          "placeholder:text-slate-400/50",
          "focus:border-slate-400/60 focus:shadow-slate-400/20 focus:shadow-md",
          "font-mono resize-none",
        ],
        "holographic-destructive": [
          "bg-black/20 border-red-400/30 text-red-400",
          "placeholder:text-red-400/50",
          "focus:border-red-400/60 focus:shadow-red-400/20 focus:shadow-md",
          "font-mono resize-none",
        ],
        glass: [
          "bg-white/10 backdrop-blur-md border-white/20",
          "focus:border-white/40 focus:shadow-white/10 focus:shadow-md",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, variant, ...props }, ref) => {
  return <textarea ref={ref} className={cn(textareaVariants({ variant }), className)} {...props} />;
});

Textarea.displayName = "Textarea";

export { Textarea, textareaVariants };
