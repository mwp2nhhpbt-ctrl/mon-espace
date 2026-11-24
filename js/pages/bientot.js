import { icon } from '../modules.js';

export function render(el, mod) {
  el.innerHTML = `
    <section class="soon">
      <div class="soon-icon">${icon(mod.icon, 40)}</div>
      <h1>${mod.label}</h1>
      <p>Cet espace arrive dans une prochaine étape.</p>
      <a class="btn" href="#/aujourdhui">Retour à Aujourd'hui ${icon('arrow', 18)}</a>
    </section>`;
}
