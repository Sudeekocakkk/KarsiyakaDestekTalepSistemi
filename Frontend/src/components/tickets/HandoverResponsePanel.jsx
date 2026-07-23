import { useState } from "react";
import { UserRoundCheck } from "lucide-react";
import Button from "../common/Button";
import ErrorAlert from "../common/ErrorAlert";
import { inputClass } from "../common/FormField";
import {
  cancelHandoverRequest,
  respondHandoverRequest,
} from "../../api/handover.api";

// Talep detayında, PENDING bir devir isteği varsa gösterilir:
// - İsteği alan kişi (requestedTo) için Kabul Et / Reddet.
// - İsteği gönderen kişi (requestedBy) için yalnızca İptal Et.
const HandoverResponsePanel = ({ handoverRequest, currentUserId, onSuccess }) => {
  const [responseNote, setResponseNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showRejectNote, setShowRejectNote] = useState(false);

  const isRecipient = handoverRequest.requestedToId === currentUserId;
  const isRequester = handoverRequest.requestedById === currentUserId;

  if (!isRecipient && !isRequester) return null;

  const handleRespond = async (decision) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError("");
    try {
      await respondHandoverRequest(handoverRequest.id, {
        decision,
        responseNote: responseNote.trim() || undefined,
      });
      onSuccess?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError("");
    try {
      await cancelHandoverRequest(handoverRequest.id);
      onSuccess?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl2 border border-sky-200 bg-sky-50 p-5">
      <div className="flex items-start gap-2">
        <UserRoundCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
        <div className="flex-1">
          {isRecipient ? (
            <>
              <p className="text-sm font-semibold text-sky-900">
                {handoverRequest.requestedBy?.name}, bu talebi size devretmek istiyor.
              </p>
              <p className="mt-1 text-sm text-sky-800">{handoverRequest.reason}</p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-sky-900">
                {handoverRequest.requestedTo?.name} kişisine devir isteği gönderdiniz, yanıt bekleniyor.
              </p>
              <p className="mt-1 text-sm text-sky-800">{handoverRequest.reason}</p>
            </>
          )}

          <ErrorAlert message={error} />

          {isRecipient && (
            <div className="mt-3 space-y-2">
              {showRejectNote && (
                <textarea
                  rows={2}
                  className={inputClass}
                  placeholder="Red nedeni (opsiyonel)..."
                  value={responseNote}
                  onChange={(event) => setResponseNote(event.target.value)}
                  disabled={isSubmitting}
                />
              )}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="success"
                  onClick={() => handleRespond("ACCEPTED")}
                  isLoading={isSubmitting}
                >
                  Kabul Et
                </Button>
                {showRejectNote ? (
                  <Button
                    variant="danger"
                    onClick={() => handleRespond("REJECTED")}
                    isLoading={isSubmitting}
                  >
                    Reddi Onayla
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectNote(true)}
                    disabled={isSubmitting}
                  >
                    Reddet
                  </Button>
                )}
              </div>
            </div>
          )}

          {isRequester && (
            <div className="mt-3">
              <Button variant="outline" onClick={handleCancel} isLoading={isSubmitting}>
                İsteği İptal Et
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HandoverResponsePanel;
