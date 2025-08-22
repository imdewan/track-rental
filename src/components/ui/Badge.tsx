import React from "react";

type BadgeVariant =
  | "blue"
  | "green"
  | "red"
  | "yellow"
  | "purple"
  | "orange"
  | "teal"
  | "pink"
  | "black"
  | "grey"
  | "maroon"
  | "lightyellow"
  | "darkgreen";

interface BadgeProps {
  color: BadgeVariant;
  character: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  color,
  character,
  size = "md",
  className = "",
}) => {
  const colorClasses = {
    blue: "bg-blue-500 text-white",
    green: "bg-green-500 text-white",
    red: "bg-red-500 text-white",
    yellow: "bg-yellow-500 text-white",
    purple: "bg-purple-500 text-white",
    orange: "bg-orange-500 text-white",
    teal: "bg-teal-500 text-white",
    pink: "bg-pink-500 text-white",
    black: "bg-black text-white",
    grey: "bg-gray-400 text-white",
    maroon: "bg-red-800 text-white",
    lightyellow: "bg-yellow-200 text-black",
    darkgreen: "bg-green-900 text-white",
  };

  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-sm",
    lg: "h-10 w-10 text-base",
  };

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full font-medium ${colorClasses[color]} ${sizeClasses[size]} ${className}`}
    >
      {character.charAt(0).toUpperCase()}
    </div>
  );
};

export default Badge;
