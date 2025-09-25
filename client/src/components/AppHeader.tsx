import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Bell, Settings, Search } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

interface AppHeaderProps {
  userName?: string;
  userAvatar?: string;
  notificationCount?: number;
  onNotificationsClick?: () => void;
  onSettingsClick?: () => void;
  onSearchClick?: () => void;
}

export default function AppHeader({
  userName = "John Doe",
  userAvatar,
  notificationCount = 0,
  onNotificationsClick,
  onSettingsClick,
  onSearchClick
}: AppHeaderProps) {
  
  const handleNotifications = () => {
    console.log('Notifications clicked');
    onNotificationsClick?.();
  };

  const handleSettings = () => {
    console.log('Settings clicked');
    onSettingsClick?.();
  };

  const handleSearch = () => {
    console.log('Search clicked');
    onSearchClick?.();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4">
        {/* Logo and Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">E</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-lg">ExpenseTracker</h1>
              <p className="text-xs text-muted-foreground">Smart Financial Management</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSearch}
            data-testid="button-search"
          >
            <Search className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNotifications}
            className="relative"
            data-testid="button-notifications"
          >
            <Bell className="h-4 w-4" />
            {notificationCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
              >
                {notificationCount > 9 ? '9+' : notificationCount}
              </Badge>
            )}
          </Button>

          <ThemeToggle />

          <Button
            variant="ghost"
            size="icon"
            onClick={handleSettings}
            data-testid="button-settings"
          >
            <Settings className="h-4 w-4" />
          </Button>

          {/* User Profile */}
          <div className="flex items-center gap-2 ml-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={userAvatar} alt={userName} />
              <AvatarFallback className="text-xs">
                {userName.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block text-sm">
              <p className="font-medium leading-none">{userName}</p>
              <p className="text-xs text-muted-foreground">Premium User</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}