// Cloudflare Pages Function
// Route: /api/submit-membership  (because this file lives at functions/api/submit-membership.js)
//
// What it does: receives the membership form JSON and commits it as a new
// file into your GitHub repo (sinfiamuli-hue/bolimulah) using the GitHub
// Contents API, so every submission lands safely in your repo instead of
// being downloaded as a local file.
//
// Required Cloudflare Pages environment variables (set in
// Pages project → Settings → Environment variables):
//   GITHUB_TOKEN   (Encrypted/secret) - fine-grained PAT, Contents: read & write,
//                  scoped to just the bolimulah repo
//   GITHUB_OWNER   e.g. "sinfiamuli-hue"
//   GITHUB_REPO    e.g. "bolimulah"
//   GITHUB_BRANCH  optional, defaults to "main"

export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json();

    // --- minimal server-side validation (mirrors the client-side rules) ---
    const errors = [];
    if (!data.fullName || String(data.fullName).trim().length < 2) errors.push('fullName');
    if (!data.address || String(data.address).trim().length < 3) errors.push('address');
    if (!/^[A-Za-z]{1,2}\d{4,6}$/.test(String(data.idNo || '').trim())) errors.push('idNo');
    if (!(Number(data.age) >= 1 && Number(data.age) <= 120)) errors.push('age');
    if (!/^[0-9+\s-]{7,15}$/.test(String(data.contactNo || '').trim())) errors.push('contactNo');

    if (errors.length) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid fields: ' + errors.join(', ') }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const owner = env.GITHUB_OWNER;
    const repo = env.GITHUB_REPO;
    const branch = env.GITHUB_BRANCH || 'main';
    const token = env.GITHUB_TOKEN;

    if (!owner || !repo || !token) {
      return new Response(JSON.stringify({ ok: false, error: 'Server not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeId = String(data.idNo).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const path = `submissions/${safeId || 'unknown'}-${timestamp}.json`;

    const record = {
      fullName: String(data.fullName).trim(),
      address: String(data.address).trim(),
      idNo: String(data.idNo).trim().toUpperCase(),
      age: Number(data.age),
      contactNo: String(data.contactNo).trim(),
      submittedAt: new Date().toISOString(),
    };

    const content = btoa(unescape(encodeURIComponent(JSON.stringify(record, null, 2))));

    const ghRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'ebm-membership-form',
          'Accept': 'application/vnd.github+json',
        },
        body: JSON.stringify({
          message: `New membership submission: ${record.idNo}`,
          content,
          branch,
        }),
      }
    );

    if (!ghRes.ok) {
      const detail = await ghRes.text();
      return new Response(JSON.stringify({ ok: false, error: 'GitHub save failed: ' + detail }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
