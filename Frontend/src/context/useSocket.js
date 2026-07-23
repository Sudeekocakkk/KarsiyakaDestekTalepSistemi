import { useContext } from "react";
import { SocketContext } from "./SocketContext.jsx";

export const useSocket = () => {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error("useSocket, SocketProvider içinde kullanılmalıdır.");
  }

  return context;
};
