export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const form = await request.formData();
    if (form.get("website")) return json({ ok: true });
    const name = clean(form.get("name"), 100);
    const email = clean(form.get("email"), 200);
    const topic = clean(form.get("topic"), 100);
    const model = clean(form.get("model"), 160);
    const message = clean(form.get("message"), 5000);
    const privacy = form.get("privacy");
    if (!name || !isEmail(email) || !topic || !message || privacy !== "accepted") return json({ error: "Bitte alle Pflichtfelder korrekt ausfüllen." }, 400);
    if (!env.RESEND_API_KEY || !env.CONTACT_TO || !env.CONTACT_FROM) return json({ error: "Kontaktversand ist noch nicht konfiguriert." }, 503);
    const subject = `[LayerForge] ${topic}`;
    const text = `Name: ${name}\nAbsender: ${email}\nThema: ${topic}\nDrucker/Filament: ${model || "-"}\n\n${message}`;
    const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: env.CONTACT_FROM, to: [env.CONTACT_TO], reply_to: email, subject, text }) });
    if (!r.ok) return json({ error: "Der Nachrichtendienst hat die Anfrage abgelehnt." }, 502);
    return json({ ok: true });
  } catch { return json({ error: "Die Nachricht konnte nicht verarbeitet werden." }, 500); }
}
function clean(value, max) { return String(value || "").trim().slice(0, max); }
function isEmail(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } }); }
