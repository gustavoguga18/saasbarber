# Yago Barbershop — Render Ready

Projeto Next.js + Supabase preparado para publicação no Render.

## O que já está estruturado

- Site público
- Agendamento
- Supabase
- Área administrativa protegida
- Agenda
- Serviços
- Horários de funcionamento
- Financeiro
- Configuração da barbearia
- RLS no banco
- APIs server-side
- `render.yaml`
- Variáveis de ambiente

## Importante

Este projeto é a base de produção e não contém credenciais reais. Antes de publicar:

1. Crie o projeto no Supabase.
2. Execute `supabase/schema.sql` no SQL Editor.
3. Crie o usuário administrador em Supabase Authentication.
4. Preencha `.env` localmente ou as Environment Variables do Render.
5. Configure WhatsApp e pagamento somente se for utilizar esses serviços.
6. Faça o deploy no Render.

## Rodar localmente

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

## Render

Você pode conectar o GitHub ao Render e usar:

Build:
```bash
npm ci && npm run build
```

Start:
```bash
npm run start
```

O arquivo `render.yaml` já contém a estrutura dessas configurações.

## Segurança

Nunca coloque `SUPABASE_SERVICE_ROLE_KEY`, tokens do WhatsApp ou token do Mercado Pago em código do navegador.

Use somente variáveis de ambiente no Render.

## Fluxo

Cliente → serviço → data → horário → dados → confirmação → registro no Supabase.

A integração de pagamento/WhatsApp depende das credenciais e configurações do respectivo provedor.
