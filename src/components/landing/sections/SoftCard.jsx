import React from "react";
import { Card } from "@/components/ui/card";

export function SoftCard({ className = "", children }) {
  return (
    <Card
      className={`rounded-[var(--radius-xl)] border-border bg-card text-card-foreground shadow-[var(--shadow-md)] ${className}`}
    >
      {children}
    </Card>
  );
}
