import { MODULES, icon } from './modules.js';

const nav = document.getElementById('nav');
const tabbar = document.getElementById('tabbar');
const view = document.getElementById('view');

function renderNav(active) {
  const link = (m) =>
    `<a href="#/${m.id}" class="nav-link${m.id === active ? ' active' : ''}">
       ${icon(m.icon)}<span>${m.label}</span>${m.ready ? '' : '<em>bientôt</em>'}
     </a>`;
  const main = MODULES.filter((m) => !m.group);
  const bonus = MODULES.filter((m) => m.group === 'Bonus');
  nav.innerHTML = `
    <div class="brand"><div class="brand-logo">H</div><div><strong>Mon Espace</strong><small>L3 LEA · Rennes 2</small></div></div>
    <div class="nav-group">${main.map(link).join('')}</div>
    <div class="nav-label">Bonus</div>
    <div class="nav-group">${bonus.map(link).join('')}</div>`;
  tabbar.innerHTML = MODULES.filter((m) => m.tab)
    .map((m) => `<a href="#/${m.id}" class="tab${m.id === active ? ' active' : ''}">${icon(m.icon, 22)}<span>${m.label}</span></a>`)
    .join('');
}

async function route() {
  const id = location.hash.replace('#/', '') || 'aujourdhui';
  const mod = MODULES.find((m) => m.id === id) || MODULES[0];
  renderNav(mod.id);
  const page = mod.ready
    ? await import(`./pages/${mod.id}.js`)
    : await import('./pages/bientot.js');
  view.innerHTML = '';
  page.render(view, mod);
  view.scrollTop = 0;
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', route);
route();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
