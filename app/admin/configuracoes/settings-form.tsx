"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Establishment = {
  id: string;
  name: string;
  slogan: string | null;
  address: string | null;
  instagram: string | null;
  whatsapp: string | null;
  timezone: string | null;
  active: boolean;
};

type SettingsFormProps = {
  establishment: Establishment;
};

export default function SettingsForm({
  establishment,
}: SettingsFormProps) {
  const router = useRouter();

  const [form, setForm] = useState({
    name: establishment.name ?? "",
    slogan: establishment.slogan ?? "",
    address: establishment.address ?? "",
    instagram: establishment.instagram ?? "",
    whatsapp: establishment.whatsapp ?? "",
    timezone: establishment.timezone ?? "America/Fortaleza",
    active: establishment.active ?? true,
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  function updateField(
    field: keyof typeof form,
    value: string | boolean
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setSuccess(false);
    setError("");
  }

  async function saveSettings() {
    if (loading) return;

    setLoading(true);
    setSuccess(false);
    setError("");

    try {
      const response = await fetch(
        "/api/admin/establishment",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ??
            "Não foi possível salvar as configurações."
        );
        return;
      }

      setForm({
        name: data.establishment.name ?? "",
        slogan: data.establishment.slogan ?? "",
        address: data.establishment.address ?? "",
        instagram: data.establishment.instagram ?? "",
        whatsapp: data.establishment.whatsapp ?? "",
        timezone:
          data.establishment.timezone ??
          "America/Fortaleza",
        active: data.establishment.active ?? true,
      });

      setSuccess(true);

      router.refresh();
    } catch (error) {
      console.error(error);

      setError(
        "Não foi possível conectar ao servidor."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="settings-form">
      <div className="settings-section-title">
        <span>IDENTIDADE</span>
        <p>Informações exibidas para seus clientes.</p>
      </div>

      <div className="settings-grid">
        <div className="settings-field settings-field-full">
          <label htmlFor="name">
            Nome da barbearia
          </label>

          <input
            id="name"
            type="text"
            value={form.name}
            onChange={(event) =>
              updateField(
                "name",
                event.target.value
              )
            }
            placeholder="Ex.: Yago Barbershop"
          />
        </div>

        <div className="settings-field settings-field-full">
          <label htmlFor="slogan">
            Slogan
          </label>

          <input
            id="slogan"
            type="text"
            value={form.slogan}
            onChange={(event) =>
              updateField(
                "slogan",
                event.target.value
              )
            }
            placeholder="Digite o slogan da barbearia"
          />
        </div>

        <div className="settings-field settings-field-full">
          <label htmlFor="address">
            Endereço
          </label>

          <input
            id="address"
            type="text"
            value={form.address}
            onChange={(event) =>
              updateField(
                "address",
                event.target.value
              )
            }
            placeholder="Rua, número, bairro, cidade..."
          />
        </div>
      </div>

      <div className="settings-section-title settings-section-spacing">
        <span>CONTATO</span>
        <p>Como seus clientes podem encontrar você.</p>
      </div>

      <div className="settings-grid">
        <div className="settings-field">
          <label htmlFor="instagram">
            Instagram
          </label>

          <div className="settings-input-prefix">
            <span>◎</span>

            <input
              id="instagram"
              type="text"
              placeholder="https://instagram.com/..."
              value={form.instagram}
              onChange={(event) =>
                updateField(
                  "instagram",
                  event.target.value
                )
              }
            />
          </div>
        </div>

        <div className="settings-field">
          <label htmlFor="whatsapp">
            WhatsApp
          </label>

          <div className="settings-input-prefix">
            <span>◉</span>

            <input
              id="whatsapp"
              type="text"
              placeholder="5585999999999"
              value={form.whatsapp}
              onChange={(event) =>
                updateField(
                  "whatsapp",
                  event.target.value
                )
              }
            />
          </div>
        </div>
      </div>

      <div className="settings-section-title settings-section-spacing">
        <span>REGIÃO E STATUS</span>
        <p>Defina o fuso horário e a disponibilidade da barbearia.</p>
      </div>

      <div className="settings-grid">
        <div className="settings-field">
          <label htmlFor="timezone">
            Fuso horário
          </label>

          <select
            id="timezone"
            value={form.timezone}
            onChange={(event) =>
              updateField(
                "timezone",
                event.target.value
              )
            }
          >
            <option value="America/Fortaleza">
              America/Fortaleza
            </option>

            <option value="America/Sao_Paulo">
              America/Sao_Paulo
            </option>
          </select>
        </div>

        <label className="settings-toggle">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(event) =>
              updateField(
                "active",
                event.target.checked
              )
            }
          />

          <span className="settings-toggle-switch">
            <span />
          </span>

          <span className="settings-toggle-content">
            <strong>
              {form.active
                ? "Barbearia ativa"
                : "Barbearia inativa"}
            </strong>

            <small>
              {form.active
                ? "O site está disponível para clientes."
                : "A barbearia ficará indisponível."}
            </small>
          </span>
        </label>
      </div>

      <div className="settings-save-area">
        <button
          type="button"
          className="button settings-save-button"
          onClick={saveSettings}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="settings-spinner" />
              Salvando...
            </>
          ) : (
            "Salvar configurações"
          )}
        </button>

        {success && (
          <div className="settings-feedback settings-feedback-success">
            <span>✓</span>
            <div>
              <strong>Alterações salvas</strong>
              <small>
                As informações foram atualizadas com sucesso.
              </small>
            </div>
          </div>
        )}

        {error && (
          <div className="settings-feedback settings-feedback-error">
            <span>!</span>
            <div>
              <strong>Não foi possível salvar</strong>
              <small>{error}</small>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
