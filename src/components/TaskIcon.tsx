import {
  Heart,
  Users,
  Camera,
  Music,
  MessageCircle,
  Wine,
  Search,
  Sparkles,
  Star,
  Crown,
  LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  heart: Heart,
  users: Users,
  camera: Camera,
  music: Music,
  message: MessageCircle,
  wine: Wine,
  search: Search,
  sparkles: Sparkles,
  star: Star,
  crown: Crown,
};

interface TaskIconProps {
  name: string;
  size?: number;
  className?: string;
}

export default function TaskIcon({ name, size = 20, className = "" }: TaskIconProps) {
  const Icon = iconMap[name] || Star;
  return <Icon size={size} className={className} />;
}
