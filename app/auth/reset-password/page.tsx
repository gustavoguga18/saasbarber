"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (password.length < 6) {
      setMessage("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    setMessage("");

    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setMessage(
        error.message || "Não foi possível alterar a senha."
      );
      setLoading(false);
      return;
    }

    setMessage("Senha alterada com sucesso!");

    setPassword("");
    setConfirmPassword("");
    setLoading(false);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "30px",
          borderRadius: "16px",
          background: "#151515",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <h1>Redefinir senha</h1>

        <p>
          Digite sua nova senha para acessar o painel administrativo.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label>Nova senha</label>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              required
              style={{
                width: "100%",
                padding: "12px",
                marginTop: "6px",
                borderRadius: "8px",
                border: "1px solid #444",
                background: "#222",
                color: "#fff",
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label>Confirmar nova senha</label>

            <input
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              required
              style={{
                width: "100%",
                padding: "12px",
                marginTop: "6px",
                borderRadius: "8px",
                border: "1px solid #444",
                background: "#222",
                color: "#fff",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
            }}
          >
            {loading ? "Alterando..." : "Alterar senha"}
          </button>
        </form>

        {message && (
          <p style={{ marginTop: "20px" }}>
            {message}
          </p>
        )}
      </div>
    </main>
  );
}
