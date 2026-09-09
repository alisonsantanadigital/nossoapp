import React from "react";
import { Button } from "./Button";
import { Plus } from "lucide-react";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-[#1E293B] rounded-3xl bg-[#131B2F]/50">
      <div className="w-16 h-16 bg-[#1E293B] text-slate-400 rounded-2xl flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400 mb-8 max-w-sm">{description}</p>

      {actionLabel && onAction && (
        <Button onClick={onAction} className="shadow-lg shadow-sky-500/20">
          <Plus className="w-4 h-4 mr-2" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
