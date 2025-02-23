export {};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initDataUnsafe?: {
          user?: {
            id: string;
            username?: string;
          };
          chat_instance?: string;
        };
        expand: () => void;  // ✅ Fix for missing `expand()` method
        close: () => void;
        sendData: (data: string) => void;
        onEvent: (event: string, callback: (data?: any) => void) => void;
        offEvent: (event: string, callback: (data?: any) => void) => void;
        showAlert: (message: string, callback?: () => void) => void;
        showConfirm: (message: string, callback: (confirmed: boolean) => void) => void;
        isExpanded?: boolean;
        themeParams?: Record<string, string>;
      };
    };
  }
}
