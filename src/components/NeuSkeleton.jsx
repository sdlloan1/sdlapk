import React from "react";

export default function NeuSkeleton({ variant = "card", className = "", width, height }) {
  const variants = {
    card: "rounded-2xl",
    avatar: "rounded-full",
    text: "rounded-lg",
    rect: "rounded-2xl",
  };
  const defaultSizes = {
    card: "h-32 w-full",
    avatar: "w-14 h-14",
    text: "h-4 w-full",
    rect: "h-24 w-full",
  };
  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;
  return (
    <div
      className={`neu-skeleton ${variants[variant] || "rounded-xl"} ${!width && !height ? defaultSizes[variant] || "" : ""} ${className}`}
      style={style}
    />
  );
}

export function NeuSkeletonCard() {
  return (
    <div className="neu-card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <NeuSkeleton variant="avatar" />
        <div className="flex-1 space-y-2">
          <NeuSkeleton variant="text" className="w-2/3" />
          <NeuSkeleton variant="text" className="w-1/3" />
        </div>
      </div>
      <NeuSkeleton variant="rect" />
    </div>
  );
}

export function NeuSkeletonList({ count = 3 }) {
  return (
    <div className="space-y-4">
      {[...Array(count)].map((_, i) => <NeuSkeletonCard key={i} />)}
    </div>
  );
}