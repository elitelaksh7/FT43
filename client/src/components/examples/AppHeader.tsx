import AppHeader from '../AppHeader';

export default function AppHeaderExample() {
  const handleNotifications = () => {
    console.log('Notifications panel opened');
  };

  const handleSettings = () => {
    console.log('Settings panel opened');
  };

  const handleSearch = () => {
    console.log('Search opened');
  };

  return (
    <AppHeader
      userName="Sarah Johnson"
      notificationCount={3}
      onNotificationsClick={handleNotifications}
      onSettingsClick={handleSettings}
      onSearchClick={handleSearch}
    />
  );
}