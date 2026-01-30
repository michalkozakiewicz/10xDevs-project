import { UserAvatar } from "./UserAvatar";

interface UserInfo {
  email: string;
  avatarUrl?: string;
}

interface TopBarProps {
  user: UserInfo;
  onLogout?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ user, onLogout }) => {
  const handleLogoClick = () => {
    window.location.href = "/sessions";
  };

  const handleLogout = async () => {
    // If custom logout handler is provided, use it
    if (onLogout) {
      onLogout();
      return;
    }

    // Default logout implementation
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Redirect to login page after successful logout
        window.location.href = "/auth/login";
      } else {
        console.error("Logout failed:", await response.text());
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div
            onClick={handleLogoClick}
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-2 py-1"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleLogoClick();
              }
            }}
          >
            <h1 className="text-xl font-bold">BucketEstimate AI</h1>
          </div>
          <UserAvatar user={user} onLogout={handleLogout} />
        </div>
      </div>
    </header>
  );
};
