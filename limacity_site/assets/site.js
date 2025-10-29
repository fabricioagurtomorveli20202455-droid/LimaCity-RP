
async function fetchText(path){ const r = await fetch(path); return r.ok ? r.text() : ''; }

function parseFrontmatter(md){
  if(md.startsWith('---')){
    const end = md.indexOf('\n---', 3);
    if(end !== -1){
      const fmRaw = md.slice(3, end).trim();
      const body = md.slice(end+4).trim();
      const fm = {};
      fmRaw.split('\n').forEach(l=>{
        const i=l.indexOf(':');
        if(i>0){ const k=l.slice(0,i).trim(); const v=l.slice(i+1).trim().replace(/^"|"$/g,''); fm[k]=v; }
      });
      return {fm, body};
    }
  }
  return {fm:{}, body:md};
}

function mdToHtml(md){
  // extremely small markdown support: headings, bold, italics, lists, paragraphs
  let html = md
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^\- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/gms, '<ul>$1</ul>');
  html = html.replace(/^(?!<h\d|<ul|<li|<strong|<em|<p|<\/)(.+)$/gim,'<p>$1</p>');
  return html;
}

async function loadCollection(dir, mapper){
  // very small directory "index": we rely on a predefined list exposed in window.__INDEX__
  const list = (window.__INDEX__ && window.__INDEX__[dir]) || [];
  const items = [];
  for(const path of list){
    const raw = await fetchText(path);
    const {fm, body} = parseFrontmatter(raw);
    items.push(mapper({fm, body, path}));
  }
  return items.join('\n');
}

async function show(section){
  document.querySelectorAll('[data-page]').forEach(el=>el.style.display='none');
  const el = document.querySelector(`[data-page="${section}"]`);
  if(!el) return;
  el.style.display='block';

  if(section==='normativas'){
    const html = await loadCollection('normativas', ({fm,body})=>`
      <div class="card"><div class="title">${fm.title||'Regla'}</div><div class="small">${mdToHtml(body)}</div></div>`);
    document.getElementById('normativas-list').innerHTML = `<div class='grid'>${html}</div>`;
  }
  if(section==='equipo'){
    const html = await loadCollection('equipo', ({fm})=>`
      <div class="card">
        <div class="title">${fm.nombre||'Miembro'}</div>
        <div class="small">${fm.rol||''}</div>
        <div class="small" style="margin-top:8px;opacity:.85">${fm.bio||''}</div>
      </div>`);
    document.getElementById('equipo-list').innerHTML = `<div class='grid'>${html}</div>`;
  }
  if(section==='tienda'){
    const html = await loadCollection('tienda', ({fm,body})=>`
      <div class="card">
        <div class="title">${fm.producto||'Producto'} <span class="badge">$${fm.precio||'0.00'}</span></div>
        <div class="small">${fm.descripcion||mdToHtml(body)}</div>
        ${fm.url ? `<a class="btn" href="${fm.url}" target="_blank" rel="noreferrer">Comprar</a>`:''}
      </div>`);
    document.getElementById('tienda-list').innerHTML = `<div class='grid'>${html}</div>`;
  }
  if(section==='actualizaciones'){
    const html = await loadCollection('actualizaciones', ({fm,body})=>`
      <div class="card">
        <div class="title">${fm.title||'Actualización'} <span class="badge">${fm.date||''}</span></div>
        <div class="small">${mdToHtml(body)}</div>
      </div>`);
    document.getElementById('updates-list').innerHTML = `<div class='grid'>${html}</div>`;
  }
}

window.addEventListener('DOMContentLoaded', ()=>{
  document.querySelectorAll('[data-link]').forEach(a=>{
    a.addEventListener('click', (e)=>{ e.preventDefault(); show(a.dataset.link); });
  });
  show('inicio');
});
