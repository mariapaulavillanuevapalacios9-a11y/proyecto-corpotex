import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

// Recibe la foto de referencia del cliente y devuelve la propuesta (modelo, material, color, estampados) en JSON.
export const runtime = "nodejs";

const client = new Anthropic(); // lee ANTHROPIC_API_KEY del entorno
const TIPOS = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
type Tipo = (typeof TIPOS)[number];

export async function POST(req: Request) {
  const form = await req.formData();
  const image = form.get("image");
  const prompt = form.get("prompt");
  if (!(image instanceof File) || typeof prompt !== "string") {
    return NextResponse.json({ code: "invalid_request" }, { status: 400 });
  }
  if (!TIPOS.includes(image.type as Tipo) || image.size > 5 * 1024 * 1024) {
    return NextResponse.json({ code: "image_rejected" }, { status: 400 });
  }
  const data = Buffer.from(await image.arrayBuffer()).toString("base64");

  try {
    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      output_config: { effort: "low" },
      // Si un filtro de seguridad rechaza la consulta, el servidor reintenta con el modelo adecuado.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: image.type as Tipo, data } },
            { type: "text", text: prompt + "\nResponde solo con el JSON, sin texto adicional." },
          ],
        },
      ],
    } as any);

    if (response.stop_reason === "refusal") {
      return NextResponse.json({ code: "refused" }, { status: 422 });
    }
    const text = response.content
      .filter((b: { type: string }) => b.type === "text")
      .map((b: any) => b.text as string)
      .join("");
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json({ code: "invalid_json" }, { status: 502 });
    return NextResponse.json(JSON.parse(match[0]));
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ code: "rate_limited" }, { status: 429 });
    }
    if (err instanceof SyntaxError) {
      return NextResponse.json({ code: "invalid_json" }, { status: 502 });
    }
    console.error(err);
    return NextResponse.json({ code: "upstream_error" }, { status: 502 });
  }
}
