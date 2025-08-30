import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@repo/ui/lib/utils";

const tableVariants = cva("w-full caption-bottom text-sm relative", {
  variants: {
    variant: {
      default: "",
      holographic: [
        "font-mono",
        "[&_th]:text-cyan-400 [&_td]:text-cyan-300",
        "[&_th]:border-cyan-400/30 [&_td]:border-cyan-400/20",
        "[&_tr]:border-cyan-400/20",
      ],
      "holographic-secondary": [
        "font-mono",
        "[&_th]:text-slate-400 [&_td]:text-slate-300",
        "[&_th]:border-slate-400/30 [&_td]:border-slate-400/20",
        "[&_tr]:border-slate-400/20",
      ],
      "holographic-destructive": [
        "font-mono",
        "[&_th]:text-red-400 [&_td]:text-red-300",
        "[&_th]:border-red-400/30 [&_td]:border-red-400/20",
        "[&_tr]:border-red-400/20",
      ],
      glass: [
        "[&_th]:text-white [&_td]:text-white/90",
        "[&_th]:border-white/30 [&_td]:border-white/20",
        "[&_tr]:border-white/20",
      ],
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const tableContainerVariants = cva("relative w-full overflow-auto", {
  variants: {
    variant: {
      default: "",
      holographic: [
        "bg-gradient-to-br from-cyan-400/5 to-cyan-600/5",
        "backdrop-blur-sm border border-cyan-400/30 rounded-lg",
        "shadow-cyan-400/20 shadow-lg",
      ],
      "holographic-secondary": [
        "bg-gradient-to-br from-slate-400/5 to-slate-600/5",
        "backdrop-blur-sm border border-slate-400/30 rounded-lg",
        "shadow-slate-400/20 shadow-lg",
      ],
      "holographic-destructive": [
        "bg-gradient-to-br from-red-400/5 to-red-600/5",
        "backdrop-blur-sm border border-red-400/30 rounded-lg",
        "shadow-red-400/20 shadow-lg",
      ],
      glass: ["bg-white/10 backdrop-blur-md border border-white/20 rounded-lg", "shadow-lg"],
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const tableRowVariants = cva("border-b transition-colors", {
  variants: {
    variant: {
      default: "hover:bg-muted/50 data-[state=selected]:bg-muted",
      holographic: [
        "hover:bg-cyan-400/10 hover:shadow-sm hover:shadow-cyan-400/20",
        "data-[state=selected]:bg-cyan-400/20 data-[state=selected]:shadow-md data-[state=selected]:shadow-cyan-400/30",
      ],
      "holographic-secondary": [
        "hover:bg-slate-400/10 hover:shadow-sm hover:shadow-slate-400/20",
        "data-[state=selected]:bg-slate-400/20 data-[state=selected]:shadow-md data-[state=selected]:shadow-slate-400/30",
      ],
      "holographic-destructive": [
        "hover:bg-red-400/10 hover:shadow-sm hover:shadow-red-400/20",
        "data-[state=selected]:bg-red-400/20 data-[state=selected]:shadow-md data-[state=selected]:shadow-red-400/30",
      ],
      glass: [
        "hover:bg-white/10 hover:backdrop-blur-sm",
        "data-[state=selected]:bg-white/20 data-[state=selected]:backdrop-blur-md",
      ],
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface TableProps extends React.HTMLAttributes<HTMLTableElement>, VariantProps<typeof tableVariants> {}

const Table = React.forwardRef<HTMLTableElement, TableProps>(({ className, variant, ...props }, ref) => (
  <div className={cn(tableContainerVariants({ variant }))}>
    <table ref={ref} className={cn(tableVariants({ variant }), className)} {...props} />
  </div>
));
Table.displayName = "Table";

export interface TableHeaderProps
  extends React.HTMLAttributes<HTMLTableSectionElement>,
    VariantProps<typeof tableVariants> {}

const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, variant, ...props }, ref) => {
    const getHeaderClasses = () => {
      switch (variant) {
        case "holographic":
          return "[&_tr]:border-b [&_tr]:border-cyan-400/30 [&_tr]:bg-cyan-400/5";
        case "holographic-secondary":
          return "[&_tr]:border-b [&_tr]:border-slate-400/30 [&_tr]:bg-slate-400/5";
        case "holographic-destructive":
          return "[&_tr]:border-b [&_tr]:border-red-400/30 [&_tr]:bg-red-400/5";
        case "glass":
          return "[&_tr]:border-b [&_tr]:border-white/30 [&_tr]:bg-white/5";
        default:
          return "[&_tr]:border-b";
      }
    };

    return <thead ref={ref} className={cn(getHeaderClasses(), className)} {...props} />;
  },
);
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  ),
);
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tfoot ref={ref} className={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)} {...props} />
  ),
);
TableFooter.displayName = "TableFooter";

export interface TableRowProps
  extends React.HTMLAttributes<HTMLTableRowElement>,
    VariantProps<typeof tableRowVariants> {}

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(({ className, variant, ...props }, ref) => (
  <tr ref={ref} className={cn(tableRowVariants({ variant }), className)} {...props} />
));
TableRow.displayName = "TableRow";

export interface TableHeadProps
  extends React.ThHTMLAttributes<HTMLTableCellElement>,
    VariantProps<typeof tableVariants> {}

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(({ className, variant, ...props }, ref) => {
  const getHeadClasses = () => {
    const baseClasses =
      "h-10 px-2 text-left align-middle font-medium [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]";

    switch (variant) {
      case "holographic":
        return cn(baseClasses, "text-cyan-400 font-mono uppercase tracking-wider");
      case "holographic-secondary":
        return cn(baseClasses, "text-slate-400 font-mono uppercase tracking-wider");
      case "holographic-destructive":
        return cn(baseClasses, "text-red-400 font-mono uppercase tracking-wider");
      case "glass":
        return cn(baseClasses, "text-white font-semibold");
      default:
        return cn(baseClasses, "text-muted-foreground");
    }
  };

  return <th ref={ref} className={cn(getHeadClasses(), className)} {...props} />;
});
TableHead.displayName = "TableHead";

export interface TableCellProps
  extends React.TdHTMLAttributes<HTMLTableCellElement>,
    VariantProps<typeof tableVariants> {}

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(({ className, variant, ...props }, ref) => {
  const getCellClasses = () => {
    const baseClasses = "p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]";

    switch (variant) {
      case "holographic":
        return cn(baseClasses, "text-cyan-300 font-mono");
      case "holographic-secondary":
        return cn(baseClasses, "text-slate-300 font-mono");
      case "holographic-destructive":
        return cn(baseClasses, "text-red-300 font-mono");
      case "glass":
        return cn(baseClasses, "text-white/90");
      default:
        return baseClasses;
    }
  };

  return <td ref={ref} className={cn(getCellClasses(), className)} {...props} />;
});
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => (
    <caption ref={ref} className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />
  ),
);
TableCaption.displayName = "TableCaption";

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  tableVariants,
  tableContainerVariants,
  tableRowVariants,
};