"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function prepareRecoverySession() {
      try {
        /*
         * ==========================================
         * 1. FLUXO PKCE
         * ==========================================
         *
         * O Supabase pode enviar:
         *
         * /auth/reset-password?code=...
         *
         * Nesse caso trocamos o código por uma sessão.
         */

        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          const { error } =
            await supabase.auth.exchangeCodeForSession(
              code
            );

          if (error) {
            console.error(
              "Erro ao trocar código por sessão:",
              error
            );

            setMessage(
              "Este link de recuperação é inválido ou já foi utilizado. Solicite um novo e-mail."
            );

            return;
          }

          /*
           * Remove o código da URL.
           */
          window.history.replaceState(
            {},
            document.title,
            "/auth/reset-password"
          );
        }

        /*
         * ==========================================
         * 2. VERIFICAÇÃO DA SESSÃO
         * ==========================================
         *
         * No fluxo com access_token, o cliente
         * Supabase pode processar automaticamente
         * os dados presentes no hash da URL.
         */

        let session = null;

        for (let attempt = 0; attempt < 10; attempt++) {
          const { data } =
            await supabase.auth.getSession();

          if (data.session) {
            session = data.session;
            break;
          }

          /*
           * Dá um pequeno tempo para o Supabase
           * processar o token da URL.
           */
          await new Promise((resolve) =>
            setTimeout(resolve, 300)
          );
        }

        if (!session) {
          setMessage(
            "Não foi possível iniciar a recuperação de senha. Solicite um novo link."
          );

          return;
        }

        /*
         * A sessão existe.
         * Agora podemos alterar a senha.
         */
        setReady(true);
      } catch (error) {
        console.error(
          "Erro ao preparar recuperação:",
          error
        );

        setMessage(
          "Não foi possível iniciar a recuperação de senha. Solicite um novo link."
        );
      }
    }

    prepareRecoverySession();
  }, []);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!ready) {
      setMessage(
        "A sessão de recuperação ainda não está pronta."
      );
      return;
    }

    if (password.length < 6) {
      setMessage(
        "A senha deve ter pelo menos 6 caracteres."
      );
      return;
    }

    if (password !== confirmPassword) {
      setMessage(
        "As senhas não coincidem."
      );
      return;
    }

    setLoading(true);
    setMessage("");

    const supabase = createClient();

    const { error } =
      await supabase.auth.updateUser({
        password,
      });

    if (error) {
      console.error(
        "Erro ao alterar senha:",
        error
      );

      setMessage(
        error.message ||
          "Não foi possível alterar a senha."
      );

      setLoading(false);
      return;
    }

    setMessage(
      "Senha alterada com sucesso!"
    );

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
          border:
            "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <h1>Redefinir senha</h1>

        <p>
          Digite sua nova senha para acessar o
          painel administrativo.
        </p>

        {!ready && !message && (
          <p>
            Validando o link de recuperação...
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div
            style={{
              marginBottom: "16px",
            }}
          >
            <label>Nova senha</label>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              required
              disabled={!ready || loading}
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

          <div
            style={{
              marginBottom: "20px",
            }}
          >
            <label>
              Confirmar nova senha
            </label>

            <input
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value
                )
              }
              required
              disabled={!ready || loading}
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
            disabled={!ready || loading}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "none",
              cursor:
                !ready || loading
                  ? "not-allowed"
                  : "pointer",
              opacity:
                !ready || loading ? 0.6 : 1,
            }}
          >
            {loading
              ? "Alterando..."
              : "Alterar senha"}
          </button>
        </form>

        {message && (
          <p
            style={{
              marginTop: "20px",
            }}
          >
            {message}
          </p>
        )}
      </div>
    </main>
  );
}
