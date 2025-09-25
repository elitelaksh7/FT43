import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, Receipt, Brain, TrendingDown, Bell, Plus } from 'lucide-react';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  active?: boolean;
}

interface MobileNavigationProps {
  onNavigate?: (itemId: string) => void;
  onQuickAdd?: () => void;
}

export default function MobileNavigation({ onNavigate, onQuickAdd }: MobileNavigationProps) {
  const [activeItem, setActiveItem] = useState('dashboard');

  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Home className="h-5 w-5" />,
      active: activeItem === 'dashboard'
    },
    {
      id: 'scanner',
      label: 'Scanner',
      icon: <Receipt className="h-5 w-5" />,
      active: activeItem === 'scanner'
    },
    {
      id: 'categorize',
      label: 'Categorize',
      icon: <Brain className="h-5 w-5" />,
      badge: 3,
      active: activeItem === 'categorize'
    },
    {
      id: 'compare',
      label: 'Compare',
      icon: <TrendingDown className="h-5 w-5" />,
      active: activeItem === 'compare'
    },
    {
      id: 'insights',
      label: 'Insights',
      icon: <Bell className="h-5 w-5" />,
      badge: 2,
      active: activeItem === 'insights'
    }
  ];

  const handleNavigation = (itemId: string) => {
    setActiveItem(itemId);
    onNavigate?.(itemId);
    console.log('Navigated to:', itemId);
  };

  const handleQuickAdd = () => {
    onQuickAdd?.();
    console.log('Quick add triggered');
  };

  return (
    <div className="relative" data-testid="mobile-navigation">
      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
        <div className="flex items-center justify-around px-2 py-2">
          {navigationItems.map((item) => (
            <Button
              key={item.id}
              variant={item.active ? "default" : "ghost"}
              size="sm"
              className="flex-1 max-w-20 h-14 flex flex-col gap-1 p-2"
              onClick={() => handleNavigation(item.id)}
              data-testid={`nav-${item.id}`}
            >
              <div className="relative">
                {item.icon}
                {item.badge && item.badge > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-4 w-4 p-0 text-xs flex items-center justify-center"
                  >
                    {item.badge}
                  </Badge>
                )}
              </div>
              <span className="text-xs font-medium truncate">{item.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Floating Action Button */}
      <Button
        size="icon"
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg z-50"
        onClick={handleQuickAdd}
        data-testid="button-quick-add"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Bottom spacing to prevent content from being hidden behind navigation */}
      <div className="h-20" />
    </div>
  );
}