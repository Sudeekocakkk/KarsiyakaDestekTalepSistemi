import { io } from "socket.io-client";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Socket.IO, REST API'nin aksine "/api" öneki olmadan sunucu kökünde
// çalışır (bkz. Backend/server.js initSocket(httpServer)).
const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, "");

let socket = null;

// Her çağrıda tek bir socket örneği kurulur/yeniden kullanılır. Token
// değiştiğinde (ör. farklı kullanıcı girişi) mevcut bağlantı kapatılıp
// yenisi açılır.
export const connectSocket = (token) => {
  if (socket?.connected && socket.auth?.token === token) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    autoConnect: true,
    reconnection: true,
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
