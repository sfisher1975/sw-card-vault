export default {
  async fetch(request) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: cors });

    try {
      const req = new URL(request.url);
      const cardUrl = req.searchParams.get("url");
      if (!cardUrl) return send({ error: "Missing PriceCharting URL" }, 400, cors);

      const target = new URL(cardUrl);
      if (target.hostname !== "www.pricecharting.com" && target.hostname !== "pricecharting.com") {
        return send({ error: "Invalid PriceCharting URL" }, 400, cors);
      }

      const pc = await fetch(target.toString(), {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.9"
        }
      });

      if (!pc.ok) return send({ error: `PriceCharting returned HTTP ${pc.status}` }, 502, cors);

      const html = await pc.text();
      const text = html
        .replace(/&nbsp;/gi, " ")
        .replace(/&#36;/gi, "$")
        .replace(/&dollar;/gi, "$")
        .replace(/&comma;/gi, ",")
        .replace(/&amp;/gi, "&")
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      const marker = text.toLowerCase().indexOf("full price guide");
      if (marker === -1) return send({ error: "Full Price Guide not found on PriceCharting page" }, 502, cors);

      const guide = text.slice(marker);
      return send({
        success: true,
        raw: findGuidePrice(guide, "Ungraded"),
        psa7: findGuidePrice(guide, "Grade 7"),
        psa8: findGuidePrice(guide, "Grade 8"),
        psa9: findGuidePrice(guide, "Grade 9"),
        source: target.toString(),
        updated: new Date().toISOString().slice(0, 10)
      }, 200, cors);
    } catch (e) {
      return send({ error: e?.message || "Price lookup failed" }, 500, cors);
    }
  }
};

function findGuidePrice(guide, grade) {
  let pattern;
  if (grade === "Ungraded") pattern = /Ungraded[\s\S]{0,250}?\$\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i;
  if (grade === "Grade 7") pattern = /Grade\s*7(?![\d.])[\s\S]{0,250}?\$\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i;
  if (grade === "Grade 8") pattern = /Grade\s*8(?![\d.])[\s\S]{0,250}?\$\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i;
  if (grade === "Grade 9") pattern = /Grade\s*9(?![\d.])[\s\S]{0,250}?\$\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i;
  if (!pattern) return null;
  const match = guide.match(pattern);
  if (!match) return null;
  const value = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(value) ? value : null;
}

function send(data, status, cors) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}
