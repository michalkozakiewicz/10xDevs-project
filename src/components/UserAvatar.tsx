import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";

interface UserInfo {
  email: string;
  avatarUrl?: string;
}

interface UserAvatarProps {
  user: UserInfo;
  onLogout?: () => void;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ user, onLogout }) => {
  // Pobierz inicjały z email (pierwsze 2 znaki przed @)
  const initials = user.email.split("@")[0].substring(0, 2).toUpperCase();

  // Jeśli nie ma handlera wylogowania, pokaż tylko awatar bez dropdown
  if (!onLogout) {
    return (
      <Avatar>
        {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.email} />}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full">
          <Avatar className="cursor-pointer">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.email} />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onLogout} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Wyloguj się</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
