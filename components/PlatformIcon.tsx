import {
  Instagram,
  Facebook,
  Twitter,
  Music,
  MessageCircle,
  Linkedin,
  FileText,
  Mail,
  Image as ImageIcon,
  LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Instagram,
  Facebook,
  Twitter,
  Music,
  MessageCircle,
  Linkedin,
  FileText,
  Mail,
  Image: ImageIcon,
};

interface PlatformIconProps {
  iconName: string;
  className?: string;
  size?: number;
  color?: string;
}

export default function PlatformIcon({
  iconName,
  className = '',
  size = 20,
  color,
}: PlatformIconProps) {
  const Icon = iconMap[iconName];

  if (!Icon) {
    // Fallback to a generic icon if not found
    return <ImageIcon className={className} size={size} color={color} />;
  }

  return <Icon className={className} size={size} color={color} />;
}
