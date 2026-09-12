import Link from "next/link";
import { createAdminClient } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function Home() {
  const admin = createAdminClient();

  const { data: establishment } = await admin
    .from("establishments")
    .select("id, name, slogan, address, instagram")
    .eq("active", true)
    .limit(1)
    .single();

  const { data: workingHours } = await admin
    .from("working_hours")
    .select("weekday, open_time, close_time, active")
    .eq("establishment_id", establishment?.id ?? "")
    .order("weekday");

  const days = [
    "Domingo",
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado",
  ];

  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">BARBEARIA</p>

        <h1>{establishment?.name ?? "Yago Barbershop"}</h1>

        <p className="slogan">
          {establishment?.slogan ?? ""}
        </p>

        <Link className="button" href="/agendar">
          Agendar horário
        </Link>
      </section>

      <section className="card">
        <h2>Horários</h2>

        {workingHours
          ?.filter(
            (hour) =>
              hour.active &&
              hour.open_time &&
              hour.close_time
          )
          .map((hour) => (
            <div className="row" key={hour.weekday}>
              <span>{days[hour.weekday]}</span>

              <strong>
                {hour.open_time.slice(0, 5)} às{" "}
                {hour.close_time.slice(0, 5)}
              </strong>
            </div>
          ))}

        <div className="row">
          <span>📍 Endereço</span>
          <span>{establishment?.address ?? ""}</span>
        </div>

        <div className="row">
          <span>Instagram</span>

          <a
            href={establishment?.instagram ?? "#"}
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
