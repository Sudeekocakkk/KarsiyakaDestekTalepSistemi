import { AlertTriangle } from "lucide-react";

// Backendden gelen hata mesajını (message) doğrudan gösterir; mesaj yoksa
// genel bir metin kullanılır.
const ErrorAlert = ({ message }) => {
  if (!message) return null;

  return (
    <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
};

export default ErrorAlert;
