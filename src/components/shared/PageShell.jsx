import { cn } from "@/lib/utils";

/** Content rhythm inside AppLayout; nested editor panels remain sections. */
export default function PageShell({ children, className, ...props }) {
  return <section className={cn("page-shell min-w-0 space-y-6", className)} {...props}>{children}</section>;
}
