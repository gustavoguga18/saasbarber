import Image from "next/image";
import Link from "next/link";
import { createAdminClient } from "@/lib/admin";
import logo from "./yago-logo.png";
import whatsappIcon from "./whatsapp.png";
import instagramIcon from "./instagram.png";

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

      {/* =========================
          MENU
      ========================= */}

      <nav className="home-nav">

        <a href="#inicio">
          Início
        </a>

        <a href="#sobre">
          Sobre
        </a>

        <a href="#servicos">
          Serviços
        </a>

        <a href="#horarios">
          Horários
        </a>

        <a href="#localizacao">
          Localização
        </a>

        <a href="#contato">
          Contato
        </a>

        <a href="#avaliacoes">
          Avaliações
        </a>

      </nav>


      {/* =========================
          HERO COM VÍDEO
      ========================= */}

      <section
        className="hero hero-video-section"
        id="inicio"
      >

        {/* VÍDEO DE FUNDO */}

        <video
          className="hero-video"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        >
          <source
            src="/barber-video.mp4"
            type="video/mp4"
          />
        </video>


        {/* CAMADA ESCURA */}

        <div
          className="hero-video-overlay"
          aria-hidden="true"
        />


        {/* DETALHE BARBER POLE */}

        <div
          className="hero-color-line"
          aria-hidden="true"
        >
          <span />
          <span />
          <span />
        </div>


        {/* CONTEÚDO */}

        <div className="hero-video-content">

          <Image
            src={logo}
            alt="Yago Barbershop"
            width={180}
            height={180}
            priority
            className="hero-video-logo"
          />

          <p className="eyebrow">
            BARBEARIA
          </p>

          <h1>
            {establishment?.name ?? "Yago Barbershop"}
          </h1>

          <p className="hero-video-slogan">
            {establishment?.slogan ??
              "CUIDA VEM DEIXAR TEU CABELO NA RÉGUA 💈"}
          </p>

          <p className="hero-video-description">
            Seu corte, seu estilo e aquele atendimento
            diferenciado.
          </p>

          <Link
            className="button hero-video-button"
            href="/agendar"
          >
            Agendar horário
          </Link>


          {/* PEQUENO INDICADOR */}

          <div className="hero-scroll-indicator">
            <span />
            <strong>
              ROLE PARA CONHECER
            </strong>
          </div>

        </div>

      </section>


      {/* =========================
          FAIXA DE IDENTIDADE
      ========================= */}

      <div
        className="barber-identity-strip"
        aria-hidden="true"
      >

        <span>
          YAGO BARBERSHOP
        </span>

        <strong>
          ✦
        </strong>

        <span>
          ESTILO NA RÉGUA
        </span>

        <strong>
          ✦
        </strong>

        <span>
          CORTE • BARBA • ESTILO
        </span>

        <strong>
          ✦
        </strong>

        <span>
          YAGO BARBERSHOP
        </span>

      </div>


      {/* =========================
          DESTAQUE GOOGLE
      ========================= */}

      <section className="card">

        <div className="home-rating">

          <div>

            <strong className="rating-number">
              5,0
            </strong>

            <span className="stars">
              ★★★★★
            </span>

          </div>

          <div>

            <strong>
              10 avaliações
            </strong>

            <span className="rating-label">
              Avaliação no Google
            </span>

          </div>

        </div>

      </section>


      {/* =========================
          SOBRE
      ========================= */}

      <section
        className="card"
        id="sobre"
      >

        <div className="section-label">
          01 / SOBRE
        </div>

        <h2>
          Sobre a Yago Barbershop
        </h2>

        <p>
          Uma barbearia pensada para você cuidar do visual,
          relaxar e sair com o cabelo na régua.
        </p>

        <p>
          Ambiente aconchegante, atendimento de qualidade e
          aquele cuidado que faz a diferença.
        </p>

      </section>


      {/* =========================
          SERVIÇOS
      ========================= */}

      <section
        className="card"
        id="servicos"
      >

        <div className="section-label">
          02 / SERVIÇOS
        </div>

        <h2>
          Escolha seu estilo
        </h2>

        {services && services.length > 0 ? (

          <div className="services-list">

            {services.map((service) => (

              <div
                className="service-item barber-service"
                key={service.id}
              >

                <div className="service-number">
                  ✂
                </div>

                <div className="service-info">

                  <strong>
                    {service.name}
                  </strong>

                  {service.description && (
                    <p>
                      {service.description}
                    </p>
                  )}

                  <span>
                    {service.duration_minutes} minutos
                  </span>

                </div>

                <strong className="service-price">
                  R${" "}
                  {Number(service.price)
                    .toFixed(2)
                    .replace(".", ",")}
                </strong>

              </div>

            ))}

          </div>

        ) : (

          <p>
            Nenhum serviço cadastrado no momento.
          </p>

        )}

        <Link
          className="button"
          href="/agendar"
        >
          Escolher serviço e agendar
        </Link>

      </section>


      {/* =========================
          HORÁRIOS
      ========================= */}

      <section
        className="card"
        id="horarios"
      >

        <div className="section-label">
          03 / HORÁRIOS
        </div>

        <h2>
          Horários de atendimento
        </h2>

        {workingHours
          ?.filter(
            (hour) =>
              hour.active &&
              hour.open_time &&
              hour.close_time
          )
          .map((hour) => (

            <div
              className="row"
              key={hour.weekday}
            >

              <span>
                {days[hour.weekday]}
              </span>

              <strong>
                {hour.open_time.slice(0, 5)} às{" "}
                {hour.close_time.slice(0, 5)}
              </strong>

            </div>

          ))}

      </section>


      {/* =========================
          LOCALIZAÇÃO
      ========================= */}

      <section
        className="card"
        id="localizacao"
      >

        <div className="section-label">
          04 / LOCALIZAÇÃO
        </div>

        <h2>
          Onde estamos
        </h2>

        <div className="row">

          <span>
            📍 Endereço
          </span>

          <strong>
            {address}
          </strong>

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


      {/* =========================
          CONTATO
      ========================= */}

      <section
        className="card"
        id="contato"
      >

        <div className="section-label">
          05 / CONTATO
        </div>

        <h2>
          Fale com a gente
        </h2>

        <div className="row">

          <span>

            <Image
              src={whatsappIcon}
              alt="WhatsApp"
              width={24}
              height={24}
              style={{
                objectFit: "contain",
                verticalAlign: "middle",
              }}
            />{" "}

            WhatsApp

          </span>

          <a
            href={`https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            (85) 98601-6629
          </a>

        </div>


        <div className="row">

          <span>

            <Image
              src={instagramIcon}
              alt="Instagram"
              width={24}
              height={24}
              style={{
                objectFit: "contain",
                verticalAlign: "middle",
              }}
            />{" "}

            Instagram

          </span>

          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            @yago_barberr
          </a>

        </div>

      </section>


      {/* =========================
          AVALIAÇÕES
      ========================= */}

      <section
        className="card"
        id="avaliacoes"
      >

        <div className="section-label">
          06 / AVALIAÇÕES
        </div>

        <h2>
          O que nossos clientes dizem
        </h2>


        <div className="review">

          <div className="review-stars">
            ★★★★★
          </div>

          <p>
            “Atendimento top, luxo e lazer excelente e o corte
            de cabelo top”
          </p>

          <strong>
            — Davi Silva Lima
          </strong>

        </div>


        <div className="review">

          <div className="review-stars">
            ★★★★★
          </div>

          <p>
            “Bom dms a barbearia, o cara corta teu cabelo e ainda
            te alimenta!”
          </p>

          <strong>
            — Ryan Pericles
          </strong>

        </div>


        <div className="review">

          <div className="review-stars">
            ★★★★★
          </div>

          <p>
            “Atendimento Excelente!”
          </p>

          <strong>
            — Gusttavo Dommy
          </strong>

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


      {/* =========================
          CTA FINAL
      ========================= */}

      <section className="hero final-cta">

        <div className="final-cta-content">

          <p className="eyebrow">
            YAGO BARBERSHOP
          </p>

          <h2>
            Pronto para deixar
            <br />
            o cabelo na régua?
          </h2>

          <p>
            Escolha seu serviço e reserve seu horário.
          </p>

          <Link
            className="button"
            href="/agendar"
          >
            Agendar meu horário
          </Link>

        </div>

      </section>


      {/* =========================
          RODAPÉ
      ========================= */}

      <footer className="site-footer">

        <p>
          © {new Date().getFullYear()}{" "}
          {establishment?.name ?? "Yago Barbershop"}
        </p>

        <p>
          Desenvolvido por{" "}
          <strong>
            Gustavo
          </strong>
        </p>

        <Link
          href="/admin/login"
          className="admin-access-link"
        >
          Área administrativa
        </Link>

      </footer>

    </main>
  );
}
