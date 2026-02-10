import React from "react";

interface BadgeProps {
  children: React.ReactNode;
}

export function ProjectBadge({ children }: BadgeProps) {
  return (
    <span className="inline-flex items-center rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
      {children}
    </span>
  );
}

export default ProjectBadge;
