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

  function updateField(
    field: keyof typeof form,
    value: string | boolean
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setSuccess(false);
  }

  async function saveSettings() {
    setLoading(true);
    setSuccess(false);

    try {
      const response = await fetch("/api/admin/establishment", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(
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
      alert("Erro ao salvar as configurações.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="settings-form">
      <div className="settings-field">
        <label htmlFor="name">Nome da barbearia</label>

        <input
          id="name"
          type="text"
          value={form.name}
          onChange={(event) =>
            updateField("name", event.target.value)
          }
        />
      </div>

      <div className="settings-field">
        <label htmlFor="slogan">Slogan</label>

        <input
          id="slogan"
          type="text"
          value={form.slogan}
          onChange={(event) =>
            updateField("slogan", event.target.value)
          }
        />
      </div>

      <div className="settings-field">
        <label htmlFor="address">Endereço</label>

        <input
          id="address"
          type="text"
          value={form.address}
          onChange={(event) =>
            updateField("address", event.target.value)
          }
        />
      </div>

      <div className="settings-field">
        <label htmlFor="instagram">Instagram</label>

        <input
          id="instagram"
          type="text"
          placeholder="@usuario"
          value={form.instagram}
          onChange={(event) =>
            updateField("instagram", event.target.value)
          }
        />
      </div>

      <div className="settings-field">
        <label htmlFor="whatsapp">WhatsApp</label>

        <input
          id="whatsapp"
          type="text"
          placeholder="5585999999999"
          value={form.whatsapp}
          onChange={(event) =>
            updateField("whatsapp", event.target.value)
          }
        />
      </div>

      <div className="settings-field">
        <label htmlFor="timezone">Fuso horário</label>

        <select
          id="timezone"
          value={form.timezone}
          onChange={(event) =>
            updateField("timezone", event.target.value)
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
            updateField("active", event.target.checked)
          }
        />

        <span>
          {form.active
            ? "Barbearia ativa"
            : "Barbearia inativa"}
        </span>
      </label>

      <div className="settings-save-wrapper">
        <button
          type="button"
          className="button"
          onClick={saveSettings}
          disabled={loading}
        >
          {loading ? "Salvando..." : "Salvar configurações"}
        </button>

        {success && (
          <span className="settings-success">
            ✓ Configurações salvas com sucesso
          </span>
        )}
      </div>
    </div>
  );
}
