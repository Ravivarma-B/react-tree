import { User, Lock, Mail } from "lucide-react";

export const IconRegistry = {
  User,
  Lock,
  Mail,
};

export type IconName = keyof typeof IconRegistry;

interface DynamicIconProps {
  name: IconName;
  size?: number;
  className?: string;
}

export const RenderIcon: React.FC<DynamicIconProps> = ({
  name,
  size = 20,
  className,
}) => {
  const Icon = IconRegistry[name];
  if (!Icon) return null;
  return <Icon size={size} className={className} />;
};
