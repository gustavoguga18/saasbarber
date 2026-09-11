"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("E-mail ou senha inválidos.");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="page narrow">
      <h1>Área administrativa</h1>
      <form className="form" onSubmit={submit}>
        <label>E-mail<input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
        <label>Senha<input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></label>
        {error && <p className="error">{error}</p>}
        <button className="button">Entrar</button>
      </form>
    </main>
  );
}