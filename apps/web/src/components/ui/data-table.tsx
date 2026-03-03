import { forwardRef, type HTMLAttributes, type TdHTMLAttributes, type ThHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Styled table wrapper with border and rounded corners. */
const Table = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)]",
        className,
      )}
      {...props}
    >
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
);
Table.displayName = "Table";

const THead = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={className} {...props} />
));
THead.displayName = "THead";

const TBody = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("divide-y divide-[var(--border)]", className)}
    {...props}
  />
));
TBody.displayName = "TBody";

const TR = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr ref={ref} className={cn("hover:bg-[var(--muted)]/20", className)} {...props} />
  ),
);
TR.displayName = "TR";

const TH = forwardRef<HTMLTableCellElement, ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "px-4 py-3 text-left font-medium text-[var(--muted-foreground)]",
        className,
      )}
      {...props}
    />
  ),
);
TH.displayName = "TH";

const TD = forwardRef<HTMLTableCellElement, TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn("px-4 py-3", className)} {...props} />
  ),
);
TD.displayName = "TD";

/** Header row with muted background. */
const TableHeaderRow = forwardRef<
  HTMLTableRowElement,
  HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b border-[var(--border)] bg-[var(--muted)]/40",
      className,
    )}
    {...props}
  />
));
TableHeaderRow.displayName = "TableHeaderRow";

export { Table, THead, TBody, TR, TH, TD, TableHeaderRow };
