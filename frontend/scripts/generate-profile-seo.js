const fs = require('node:fs/promises');
const path = require('node:path');

const API = 'https://topopro-fc-api.onrender.com/api';
const SITE = 'https://topopro-fc.com';
const FRONTEND = path.resolve(__dirname, '..');
const DIST = path.join(FRONTEND, 'dist', 'frontend');
const TEMPLATE = path.join(DIST, 'index.html');
const SITEMAP = path.join(DIST, 'sitemap.xml');

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function setMeta(html, attribute, key, content) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(
    `<meta\\s+[^>]*${attribute}\\s*=\\s*["']${escapedKey}["'][^>]*>`,
    'i'
  );
  const tag = `<meta ${attribute}="${escapeHtml(key)}" content="${escapeHtml(content)}">`;

  return regex.test(html)
    ? html.replace(regex, tag)
    : html.replace(/<\/head>/i, `  ${tag}\n</head>`);
}

function setCanonical(html, url) {
  const tag = `<link rel="canonical" href="${escapeHtml(url)}">`;
  const regex = /<link\s+[^>]*rel=["']canonical["'][^>]*>/i;

  return regex.test(html)
    ? html.replace(regex, tag)
    : html.replace(/<\/head>/i, `  ${tag}\n</head>`);
}

async function main() {
  const template = await fs.readFile(TEMPLATE, 'utf8');

  const response = await fetch(`${API}/directorio`);
  if (!response.ok) {
    throw new Error(`La API respondió HTTP ${response.status}`);
  }

  const result = await response.json();
  const profiles = Array.isArray(result)
    ? result
    : Array.isArray(result?.data)
      ? result.data
      : null;

  if (!profiles || profiles.length === 0) {
    throw new Error('La API no devolvió una lista válida de perfiles públicos.');
  }

  for (const profile of profiles) {
    if (
      profile?.id == null ||
      !/^[a-zA-Z0-9_-]+$/.test(String(profile.id))
    ) {
      throw new Error('La API devolvió un perfil con un ID inválido.');
    }
  }

  const sitemapUrls = [
    `${SITE}/`,
    `${SITE}/directorio`,
    `${SITE}/publicaciones`
  ];

  for (const profile of profiles) {
    const fullName = [profile.nombre, profile.apellido]
      .filter(Boolean)
      .join(' ')
      .trim();

    const title = `${fullName || 'Profesional'} | ${profile.profesion || 'Profesional de topografía'} | TopoPro FC`;
    const location = [profile.ciudad, profile.pais]
      .filter(Boolean)
      .join(', ');
    const description = `Perfil profesional de ${fullName || 'profesional'}${profile.profesion ? `, ${profile.profesion}` : ''}${location ? ` en ${location}` : ''}. Consulta sus trabajos y publicaciones en TopoPro FC.`;
    const url = `${SITE}/perfil-publico/${encodeURIComponent(profile.id)}`;

    let html = template;

    html = html.replace(
      /<title>[\s\S]*?<\/title>/i,
      `<title>${escapeHtml(title)}</title>`
    );

    html = setMeta(html, 'name', 'description', description);
    html = setMeta(html, 'name', 'robots', 'index, follow');
    html = setMeta(html, 'property', 'og:type', 'profile');
    html = setMeta(html, 'property', 'og:title', title);
    html = setMeta(html, 'property', 'og:description', description);
    html = setMeta(html, 'property', 'og:url', url);
    html = setMeta(html, 'name', 'twitter:card', 'summary_large_image');
    html = setMeta(html, 'name', 'twitter:title', title);
    html = setMeta(html, 'name', 'twitter:description', description);

    if (profile.foto && /^https:\/\//i.test(profile.foto)) {
      html = setMeta(html, 'property', 'og:image', profile.foto);
      html = setMeta(html, 'name', 'twitter:image', profile.foto);
    }

    html = setCanonical(html, url);

    const profileDir = path.join(
      DIST,
      'perfil-publico',
      String(profile.id)
    );

    await fs.mkdir(profileDir, { recursive: true });
    await fs.writeFile(path.join(profileDir, 'index.html'), html, 'utf8');

    sitemapUrls.push(url);
    console.log(`HTML generado: /perfil-publico/${profile.id}`);
  }

  const uniqueUrls = [...new Set(sitemapUrls)];
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...uniqueUrls.map((url) =>
      `  <url><loc>${escapeHtml(url)}</loc></url>`
    ),
    '</urlset>',
    ''
  ].join('\n');

  await fs.writeFile(SITEMAP, sitemap, 'utf8');

  console.log(`\nPerfiles procesados: ${profiles.length}`);
  console.log(`Carpeta publicada: ${DIST}`);
}

main().catch((error) => {
  console.error('ERROR SEO:', error.message);
  process.exitCode = 1;
});
