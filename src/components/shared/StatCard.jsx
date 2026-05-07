import React from "react";
import { motion } from "framer-motion";

export default function StatCard({ icon: Icon, label, value, trend, color = "primary" }) {
  const colorMap = {
    primary: "text-primary bg-primary/10 border-primary/20",
    green: "text-green-400 bg-green-400/10 border-green-400/20",
    orange: "text-orange-400 bg-orange-400/10 border-orange-400/20",
    purple: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
          <p className="text-2xl font-bold font-heading mt-2 text-foreground">{value}</p>
          {trend && (
            <p className="text-xs text-green-400 mt-1">{trend}</p>
          )}
        </div>
        <div className={`p-2.5 rounded-lg border ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
}