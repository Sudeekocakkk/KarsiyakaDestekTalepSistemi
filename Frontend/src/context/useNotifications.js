import { useContext } from "react";
import { NotificationContext } from "./NotificationContext.jsx";

export const useNotifications = () => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error("useNotifications, NotificationProvider içinde kullanılmalıdır.");
  }

  return context;
};
