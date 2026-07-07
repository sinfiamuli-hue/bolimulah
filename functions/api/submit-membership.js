// Cloudflare Pages Function
// Route: /api/submit-membership  (because this file lives at functions/api/submit-membership.js)
//
// What it does: receives the membership form JSON and commits it as a new
// file into your PRIVATE data repo (sinfiamuli-hue/bolimulah-membership-data)
// using the GitHub Contents API. Submissions never touch the public
// bolimulah website repo, so member data (name, address, ID number, etc.)
// stays private.
//
// Required Cloudflare Pages environment variables (Settings → Variables
// and secrets, under the Production environment):
//   GITHUB_TOKEN       (Secret) - fine-grained PAT, Contents: read & write,
//                       scoped to the bolimulah-membership-data repo
//                       (and no longer needs access to the public bolimulah repo)
//   GITHUB_OWNER        e.g. "sinfiamuli-hue"
//   SUBMISSIONS_REPO    "bolimulah-membership-data"
//   GITHUB_BRANCH       optional, defaults to "main"

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
    const repo = env.SUBMISSIONS_REPO;
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

    // Encode UTF-8 text (including Dhivehi/Thaana script) to base64 safely.
    // The old btoa(unescape(encodeURIComponent(...))) trick is unreliable in the
    // Cloudflare Workers runtime — this uses TextEncoder + a manual byte-to-base64
    // conversion instead, which works correctly for any Unicode text.
    function utf8ToBase64(str) {
      const bytes = new TextEncoder().encode(str);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    }

    const content = utf8ToBase64(JSON.stringify(record, null, 2));

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
