import { createContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./useAuth";
import { tokenStorage } from "../api/axiosClient";
import { connectSocket, disconnectSocket } from "../socket/socketClient";

export const SocketContext = createContext(null);

// Kullanıcı oturum açtığında socket bağlantısını kurar, çıkış yapınca
// kapatır. Bağlantı kopup tekrar kurulduğunda (`connect` eventi) diğer
// context'lerin (ör. NotificationContext) kaçırılmış olabilecek verileri
// DB'den tekrar çekebilmesi için `isConnected`/`connectionEpoch` sağlar.
export const SocketProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionEpoch, setConnectionEpoch] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      setSocket(null);
      setIsConnected(false);
      return;
    }

    const token = tokenStorage.get();
    if (!token) return;

    const instance = connectSocket(token);
    setSocket(instance);

    const handleConnect = () => {
      setIsConnected(true);
      setConnectionEpoch((prev) => prev + 1);
    };
    const handleDisconnect = () => setIsConnected(false);

    instance.on("connect", handleConnect);
    instance.on("disconnect", handleDisconnect);

    return () => {
      instance.off("connect", handleConnect);
      instance.off("disconnect", handleDisconnect);
    };
  }, [isAuthenticated]);

  const value = useMemo(
    () => ({ socket, isConnected, connectionEpoch }),
    [socket, isConnected, connectionEpoch]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
