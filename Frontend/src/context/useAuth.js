import { useContext } from "react";
import { AuthContext } from "./AuthContext.jsx";

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth, AuthProvider içinde kullanılmalıdır.");
  }

  return context;
};
