// No necesitamos imports externos para Deno.serve moderno
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // Manejo estricto de CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const { email, nombreSupervisor, encuestado, respuestas } = payload;

    // 1. Procesar Textos
    const listaTextoHtml = respuestas
      .filter((r: any) => !r.fotourl)
      .map((r: any) => `<li><strong>${r.pregunta}:</strong> ${r.respuesta || 'Sin respuesta'}</li>`)
      .join("");

    // 2. Procesar Fotos
    const listaFotosHtml = respuestas
      .filter((r: any) => r.fotourl && r.fotourl.length > 0) // Solo los que tienen URL
      .map((r: any) => `
        <div style="margin-top:15px;">
          <p><strong>${r.pregunta}:</strong></p>
          <img src="${r.fotourl}" width="300" style="border-radius:8px;" />
        </div>
      `).join("");

    const RESEND_API_KEY = "re_R2yxCboi_KZ94juMcF94NZpYMsddbTyjn";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Reporte <onboarding@resend.dev>",
        to: [email],
        subject: `Informe de Encuesta: ${encuestado}`,
        html: `
          <div style="font-family: sans-serif; color: #333;">
            <h2>Resumen de Encuesta</h2>
            <p>Hola <strong>${nombreSupervisor}</strong>, el usuario <strong>${encuestado}</strong> ha enviado información:</p>
            <h3>Respuestas:</h3>
            <ul>${listaTextoHtml}</ul>
            <h3>Evidencia Fotográfica:</h3>
            ${listaFotosHtml || "<p>No se adjuntaron fotos.</p>"}
          </div>
        `,
      }),
    });

    const emailStatus = await res.json();

    return new Response(JSON.stringify({ success: true, emailStatus }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    // Si llegamos aquí, devolvemos el error con CORS para que React pueda leerlo
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});