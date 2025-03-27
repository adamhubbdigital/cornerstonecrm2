import React, { useEffect, useState } from 'react';
import { X, Download, Bell } from 'lucide-react';

const PWAPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if the app is already installed
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
    if (isInstalled) {
      setShowPrompt(false);
    }

    // Check notification permission after installation
    if (isInstalled && Notification.permission === 'default') {
      setShowNotificationPrompt(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowPrompt(false);
        // Show notification prompt after installation
        setShowNotificationPrompt(true);
      }
    }
  };

  const handleEnableNotifications = async () => {
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        // Register for push notifications here
        const registration = await navigator.serviceWorker.ready;
        // You would typically send this to your server
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: 'YOUR_VAPID_PUBLIC_KEY' // You'll need to replace this
        });
        setShowNotificationPrompt(false);
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  if (!showPrompt && !showNotificationPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-lg shadow-lg p-4 z-50">
      {showPrompt ? (
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <img
              src="https://pregnancyadvice.org.uk/Images/Content/2315/743240.png?modify_dt=635787726343730000"
              alt="CRM Logo"
              className="w-12 h-12 rounded-lg"
            />
            <div>
              <h3 className="font-semibold text-gray-900">Install CRM</h3>
              <p className="text-sm text-gray-600">Add to your home screen for quick access</p>
            </div>
          </div>
          <button
            onClick={() => setShowPrompt(false)}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Bell className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Enable Notifications</h3>
              <p className="text-sm text-gray-600">Stay updated with important tasks and events</p>
            </div>
          </div>
          <button
            onClick={() => setShowNotificationPrompt(false)}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
      <div className="mt-4 flex space-x-3">
        {showPrompt ? (
          <>
            <button
              onClick={handleInstall}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Download className="h-4 w-4 inline-block mr-2" />
              Install
            </button>
            <button
              onClick={() => setShowPrompt(false)}
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Not now
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleEnableNotifications}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Enable
            </button>
            <button
              onClick={() => setShowNotificationPrompt(false)}
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Maybe later
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PWAPrompt;