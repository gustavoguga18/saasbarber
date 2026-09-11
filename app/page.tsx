import Link from "next/link";
import { establishment } from "@/config/establishment";

export default function Home() {
  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">BARBEARIA</p>
        <h1>{establishment.name}</h1>
        <p className="slogan">{establishment.slogan}</p>
        <Link className="button" href="/agendar">Agendar horário</Link>
      </section>

      <section className="card">
        <h2>Horários</h2>
        <p>Segunda a quinta: 09:00 às 19:00</p>
        <p>Sexta e sábado: 09:00 às 20:00</p>
        <p>{establishment.address}</p>
        <a href={establishment.instagram} target="_blank">Instagram</a>
      </section>
    </main>
  );
}