import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface AvatarNameProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AvatarName({ name, size = "md", className }: AvatarNameProps) {
  // Get initials from the name
  const getInitials = (name: string) => {
    if (!name) return "";
    const parts = name.split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };
  
  // Generate a deterministic color based on the name
  const getColorFromName = (name: string) => {
    const colors = [
      "bg-blue-500",     // Primary (blue)
      "bg-[#f50057]",    // Secondary (pink)
      "bg-green-600",    // Success
      "bg-orange-500",   // Warning
      "bg-gray-600",     // Neutral
      "bg-purple-500",   // Purple
      "bg-teal-500",     // Teal
      "bg-yellow-600",   // Yellow
    ];
    
    // Simple string hash function
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Use the hash to pick a color
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };
  
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-base"
  };
  
  const bgColor = getColorFromName(name);
  const initials = getInitials(name);
  
  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarFallback className={cn("text-white", bgColor)}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
