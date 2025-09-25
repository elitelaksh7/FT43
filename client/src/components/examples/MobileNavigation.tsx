import MobileNavigation from '../MobileNavigation';

export default function MobileNavigationExample() {
  const handleNavigate = (itemId: string) => {
    console.log('Navigation to:', itemId);
  };

  const handleQuickAdd = () => {
    console.log('Quick add expense triggered');
  };

  return (
    <div className="h-96 relative">
      <div className="p-4 space-y-4">
        <p>Scroll down to see the mobile navigation</p>
        <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
          <p className="text-muted-foreground">Main content area</p>
        </div>
      </div>
      <MobileNavigation onNavigate={handleNavigate} onQuickAdd={handleQuickAdd} />
    </div>
  );
}