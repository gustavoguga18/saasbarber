"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PaymentActionProps = {
  paymentId: string;
};

export default function PaymentAction({
  paymentId,
}: PaymentActionProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function markAsPaid() {
    if (loading) return;

    const confirmed = window.confirm(
      "Confirmar que este pagamento foi recebido?"
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      const response = await fetch("/api/admin/payments", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.error ??
            "Não foi possível marcar o pagamento como pago."
        );
        return;
      }

      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Erro ao atualizar o pagamento.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      className="button"
      onClick={markAsPaid}
      disabled={loading}
    >
      {loading ? "Salvando..." : "Marcar como pago"}
    </button>
  );
}
