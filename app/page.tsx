import Image from "next/image";
import Link from "next/link";
import { createAdminClient } from "@/lib/admin";
import logo from "./yago-logo.jpeg";

export const dynamic = "force-dynamic";

export default async function Home() {
  const admin = createAdminClient();

  const { data: establishment } = await admin
    .from("establishments")
    .select("id, name, slogan, address, instagram, whatsapp")
    .eq("active", true)
    .limit(1)
    .single();

  const { data: workingHours } = await admin
    .from("working_hours")
    .select("weekday, open_time, close_time, active")
    .eq("establishment_id", establishment?.id ?? "")
    .order("weekday");

  const { data: services } = await admin
    .from("services")
    .select("id, name, description, price, duration_minutes")
    .eq("establishment_id", establishment?.id ?? "")
    .eq("active", true)
    .order("name");

  const days = [
    "Domingo",
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado",
  ];

  const whatsappNumber =
    establishment?.whatsapp?.replace(/\D/g, "") ??
    "5585986016629";

  const instagramUrl =
    establishment?.instagram ??
    "https://www.instagram.com/yago_barberr/";

  const address =
    establishment?.address ??
    "R. Bom Jesus, 957 - Bom Jardim, Fortaleza - CE, 60543-365";

  const mapsUrl =
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(address);

  const mapEmbedUrl =
    "https://www.google.com/maps?q=" +
    encodeURIComponent(address) +
    "&output=embed";

  return (
    <main className="page">
      {/* HERO */}
<section className="hero">
  <Image
    src={logo}
    alt="Yago Barbershop"
    width={280}
    height={280}
    priority
    style={{
      width: "280px",
      height: "280px",
      objectFit: "contain",
      margin: "0 auto 20px",
    }}
  />

  <p className="eyebrow">BARBEARIA</p>

        <h1>{establishment?.name ?? "Yago Barbershop"}</h1>

        <p className="slogan">
          {establishment?.slogan ??
            "CUIDA VEM DEIXAR TEU CABELO NA RÉGUA 💈"}
        </p>

        <p>
          Seu corte, seu estilo e aquele atendimento diferenciado.
          Agende seu horário de forma rápida e fácil.
        </p>

        <Link className="button" href="/agendar">
          Agendar horário
        </Link>
      </section>

      {/* DESTAQUE GOOGLE */}
      <section className="card">
        <div className="home-rating">
          <div>
            <strong className="rating-number">5,0</strong>
            <span className="stars">★★★★★</span>
          </div>

          <div>
            <strong>10 avaliações</strong>
            <span className="rating-label">
              Avaliação no Google
            </span>
          </div>
        </div>
      </section>

      {/* SOBRE */}
      <section className="card">
        <h2>Sobre a Yago Barbershop</h2>

        <p>
          Uma barbearia pensada para você cuidar do visual,
          relaxar e sair com o cabelo na régua.
        </p>

        <p>
          Ambiente aconchegante, atendimento de qualidade e
          aquele cuidado que faz a diferença.
        </p>
      </section>

      {/* SERVIÇOS */}
      <section className="card">
        <h2>Serviços</h2>

        {services && services.length > 0 ? (
          <div className="services-list">
            {services.map((service) => (
              <div className="service-item" key={service.id}>
                <div>
                  <strong>{service.name}</strong>

                  {service.description && (
                    <p>{service.description}</p>
                  )}

                  <span>
                    {service.duration_minutes} minutos
                  </span>
                </div>

                <strong>
                  R$ {Number(service.price).toFixed(2).replace(".", ",")}
                </strong>
              </div>
            ))}
          </div>
        ) : (
          <p>Nenhum serviço cadastrado no momento.</p>
        )}

        <Link className="button" href="/agendar">
          Escolher serviço e agendar
        </Link>
      </section>

      {/* HORÁRIOS */}
      <section className="card">
        <h2>Horários de atendimento</h2>

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
      </section>

      {/* LOCALIZAÇÃO */}
      <section className="card">
        <h2>Onde estamos</h2>

        <div className="row">
          <span>📍 Endereço</span>
          <strong>{address}</strong>
        </div>

        <div className="map-container">
          <iframe
            src={mapEmbedUrl}
            width="100%"
            height="260"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Localização da Yago Barbershop"
          />
        </div>

        <a
          className="button"
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          📍 Como chegar
        </a>
      </section>

      {/* CONTATO */}
      <section className="card">
        <h2>Entre em contato</h2>

        <div className="row">
          <span>📱 WhatsApp</span>

          <a
            href={`https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            (85) 98601-6629
          </a>
        </div>

        <div className="row">
          <span>📸 Instagram</span>

          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            @yago_barberr
          </a>
        </div>
      </section>

      {/* AVALIAÇÕES */}
      <section className="card">
        <h2>O que nossos clientes dizem</h2>

        <div className="review">
          <div className="review-stars">★★★★★</div>

          <p>
            “Atendimento top, luxo e lazer excelente e o corte
            de cabelo top”
          </p>

          <strong>— Davi Silva Lima</strong>
        </div>

        <div className="review">
          <div className="review-stars">★★★★★</div>

          <p>
            “Bom dms a barbearia, o cara corta teu cabelo e ainda
            te alimenta!”
          </p>

          <strong>— Ryan Pericles</strong>
        </div>

        <div className="review">
          <div className="review-stars">★★★★★</div>

          <p>“Atendimento Excelente!”</p>

          <strong>— Gusttavo Dommy</strong>
        </div>

        <a
          className="button secondary-button"
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Ver avaliações no Google
        </a>
      </section>

      {/* CTA FINAL */}
      <section className="hero final-cta">
        <h2>Pronto para deixar o cabelo na régua?</h2>

        <p>
          Escolha seu serviço e reserve seu horário.
        </p>

        <Link className="button" href="/agendar">
          Agendar meu horário
        </Link>
      </section>

      {/* RODAPÉ */}
      <footer className="site-footer">
        <p>
          © {new Date().getFullYear()}{" "}
          {establishment?.name ?? "Yago Barbershop"}
        </p>

        <p>
          Desenvolvido por <strong>Gustavo</strong>
        </p>
      </footer>
    </main>
  );
}
