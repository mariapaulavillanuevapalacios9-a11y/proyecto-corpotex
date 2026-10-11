import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

/**
 * Envía los correos automáticos de la app:
 *  - alertas de reabastecimiento de insumos
 *  - reportes y alertas del cronómetro de abastecimiento
 *
 * Configura en .env.local:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 * Si falta la configuración, responde { ok: false } y la app marca el correo como "Sin servidor de correo".
 */
export const runtime = "nodejs";

export async function POST(req: Request) {
  const { to, subject, text } = (await req.json().catch(() => ({}))) as {
    to?: string;
    subject?: string;
    text?: string;
  };

  if (!to || !subject || !text) {
    return NextResponse.json({ ok: false, error: "Faltan to, subject o text" }, { status: 400 });
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return NextResponse.json({ ok: false, error: "SMTP no configurado" });
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  try {
    await transporter.sendMail({
      from: SMTP_FROM || SMTP_USER,
      to, // admite varios destinatarios separados por coma
      subject: `[CORPOTEX] ${subject}`,
      text,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error enviando correo:", err);
    return NextResponse.json({ ok: false, error: "No se pudo enviar" }, { status: 502 });
  }
}
