/**
 * Cloudflare Pages Function
 * -------------------------
 * Deploys automatically with the rest of the site — no separate service
 * to stand up. Cloudflare Pages turns any file under /functions into an
 * endpoint at the matching path, so this file becomes:
 *
 *     POST https://bolimulah.sinfia.net/api/submit-membership
 *
 * which is exactly what membership/index.html calls.
 *
 * Your GitHub token lives ONLY as an environment variable set in the
 * Cloudflare Pages dashboard (Settings → Environment variables → encrypt).
 * It is never present in any file a visitor's browser can see.
 *
 * One-time setup:
 *   1. GitHub → Settings → Developer settings → Fine-grained tokens →
 *      Generate new token. Scope it to ONLY this repo, with
 *      "Contents: Read and write" permission.
 *   2. Cloudflare dashboard → your Pages project → Settings →
 *      Environment variables → add, for the Production environment:
 *        GITHUB_TOKEN   (click "Encrypt")  = the token from step 1
 *        GITHUB_OWNER   = sinfiamuli-hue
 *        GITHUB_REPO    = bolimulah
 *        GITHUB_BRANCH  = main
 *   3. Redeploy the Pages project (or trigger a new deploy by pushing
 *      any commit) so the Function picks up the new variables.
 *
 * That's it — nothing in index.html or membership/index.html needs to
 * reference the token at all.
 */

export async function onRequestPost({ request, env }) {
  let data;
  try {
    data = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const required = ["fullName", "address", "idNo", "age", "contactNo"];
  for (const key of required) {
    if (data[key] === undefined || data[key] === "") {
      return new Response(`Missing field: ${key}`, { status: 400 });
    }
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const safeId = String(data.idNo).replace(/[^A-Za-z0-9]/g, "");
  const path = `submissions/${timestamp}-${safeId || "entry"}.json`;

  const githubRes = await fetch(
    `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${path}`,
    {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
        "Content-Type": "application/json",
        "User-Agent": "ebm-membership-form",
        "Accept": "application/vnd.github+json",
      },
      body: JSON.stringify({
        message: `New membership submission (${data.fullName})`,
        content: btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2)))),
        branch: env.GITHUB_BRANCH || "main",
      }),
    }
  );

  if (!githubRes.ok) {
    const errText = await githubRes.text();
    return new Response(`GitHub error: ${errText}`, { status: 502 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204 });
}
