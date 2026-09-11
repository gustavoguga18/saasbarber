import Link from "next/link";
import { establishment } from "@/config/establishment";

export default function Home() {
  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">BARBEARIA</p>

        <h1>{establishment.name}</h1>

        <p className="slogan">{establishment.slogan}</p>

        <Link className="button" href="/agendar">
          Agendar horário
        </Link>
      </section>

      <section className="card">
        <h2>Horários</h2>

        <div className="row">
          <span>Segunda a quinta</span>
          <strong>09:00 às 19:00</strong>
        </div>

        <div className="row">
          <span>Sexta e sábado</span>
          <strong>09:00 às 20:00</strong>
        </div>

        <div className="row">
          <span>📍 Endereço</span>
          <span>{establishment.address}</span>
        </div>

        <div className="row">
          <span>Instagram</span>

          <a
            href={establishment.instagram}
            target="_blank"
            rel="noopener noreferrer"
          >
            @yago_barberr
          </a>
        </div>
      </section>
    </main>
  );
}
