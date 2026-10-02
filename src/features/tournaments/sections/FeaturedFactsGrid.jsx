import React from "react";
import FactCard from "@/features/tournaments/components/FactCard";

export function FeaturedFactsGrid({ facts }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-2 xl:grid-cols-4 mb-8">
      {facts.map((fact) => {
        const Icon = fact.icon;
        return (
          <FactCard
            key={fact.label}
            label={fact.label}
            value={fact.value}
            icon={<Icon />}
            variant={fact.variant}
          />
        );
      })}
    </div>
  );
}
