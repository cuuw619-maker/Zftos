import { engine } from './engine.js';

const clock = document.getElementById('clock');
const title = document.getElementById('screenTitle');
const eyebrow = document.getElementById('eyebrow');
const screen = document.getElementById('screen');
const nav = document.getElementById('floatingNav');
const navItems = document.getElementById('navItems');
const navSelection = document.getElementById('navSelection');
const hint = document.getElementById('navHint');

const CATEGORIES = [
  { id: 'home', icon: '⌂', title: 'Главная', subtitle: 'Ваше пространство', cards: ['Недавние', 'Избранное', 'Продолжить'] },
  { id: 'apps', icon: '✦', title: 'Приложения', subtitle: 'Все приложения', cards: ['Медиа', 'Инструменты', 'Система'] },
  { id: 'search', icon: '⌕', title: 'Поиск', subtitle: 'Найти что угодно', cards: ['Приложения', 'Файлы', 'Настройки'] },
  { id: 'alerts', icon: '◌', title: 'Уведомления', subtitle: 'Всё важное здесь', cards: ['Сегодня', 'Сообщения', 'События'] },
  { id: 'settings', icon: '⚙', title: 'Настройки', subtitle: 'Персонализация системы', cards: ['Внешний вид', 'Звук и тактильные сигналы', 'Конфиденциальность'] },
];

let selected = 0;
let expanded = false;
let pressing = false;
let pointerId = null;
let startX = 0;
let activeIndex = 0;
let longPressTimer = 0;
let pageTimer = 0;

function updateClock() {
  clock.textContent = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
}

function renderNav() {
  navItems.replaceChildren();
  CATEGORIES.forEach((item, index) => {
    const button = document.createElement('button');
    button.className = 'nav-item';
    button.type = 'button';
    button.dataset.index = index;
    button.setAttribute('aria-label', item.title);
    button.innerHTML = `<span class="nav-icon">${item.icon}</span><span class="nav-label">${item.title}</span>`;
    button.addEventListener('click', () => selectCategory(index));
    navItems.appendChild(button);
  });
  updateNav();
}

function renderScreen() {
  const item = CATEGORIES[selected];
  title.textContent = item.title;
  eyebrow.textContent = item.subtitle;
  screen.className = `screen screen-${item.id}`;
  screen.replaceChildren();

  const hero = document.createElement('article');
  hero.className = 'hero-card';
  hero.innerHTML = `<span class="hero-symbol">${item.icon}</span><div><span class="card-kicker">${String(selected + 1).padStart(2, '0')} / ${String(CATEGORIES.length).padStart(2, '0')}</span><h2>${item.subtitle}</h2><p>Проведите по плавающему стеку, чтобы сменить контекст.</p></div>`;
  screen.appendChild(hero);

  const grid = document.createElement('div');
  grid.className = 'card-grid';
  item.cards.forEach((label, index) => {
    const card = document.createElement('article');
    card.className = 'glass-card';
    card.style.setProperty('--delay', `${index * 55}ms`);
    card.innerHTML = `<span class="mini-icon">${['◈', '◇', '○'][index]}</span><strong>${label}</strong><span class="chevron">›</span>`;
    grid.appendChild(card);
  });
  screen.appendChild(grid);
}

function updateNav() {
  [...navItems.children].forEach((item, index) => {
    item.classList.toggle('selected', index === selected);
    item.classList.toggle('preview', expanded && index === activeIndex);
  });
  const target = navItems.children[expanded ? activeIndex : selected];
  if (target) {
    const navRect = nav.getBoundingClientRect();
    const rect = target.getBoundingClientRect();
    navSelection.style.width = `${rect.width}px`;
    navSelection.style.height = `${rect.height}px`;
    navSelection.style.transform = `translate(${rect.left - navRect.left}px, ${rect.top - navRect.top}px)`;
  }
  nav.classList.toggle('expanded', expanded);
  nav.style.setProperty('--active', expanded ? activeIndex : selected);
}

function selectCategory(index) {
  selected = Math.max(0, Math.min(CATEGORIES.length - 1, index));
  activeIndex = selected;
  renderScreen();
  updateNav();
  engine.set('category', CATEGORIES[selected].id);
  engine.emit('navigation:changed', CATEGORIES[selected]);
}

function expand() {
  if (expanded) return;
  expanded = true;
  activeIndex = selected;
  hint.classList.add('hidden');
  updateNav();
  engine.emit('navigation:expanded');
}

function collapse(commit = true) {
  clearTimeout(longPressTimer);
  if (!expanded) return;
  const next = activeIndex;
  expanded = false;
  if (commit && next !== selected) selectCategory(next);
  else updateNav();
  engine.emit('navigation:collapsed', { index: next });
}

function moveSelection(clientX) {
  if (!expanded) return;
  const rect = nav.getBoundingClientRect();
  const usable = Math.max(1, rect.width - 28);
  const x = Math.max(14, Math.min(rect.width - 14, clientX - rect.left));
  const ratio = (x - 14) / usable;
  activeIndex = Math.max(0, Math.min(CATEGORIES.length - 1, Math.round(ratio * (CATEGORIES.length - 1))));
  updateNav();
  if (activeIndex !== selected) {
    renderPreview(activeIndex);
  }
}

function renderPreview(index) {
  const item = CATEGORIES[index];
  title.textContent = item.title;
  eyebrow.textContent = item.subtitle;
}

function pointerDown(event) {
  if (pointerId !== null) return;
  pointerId = event.pointerId;
  startX = event.clientX;
  pressing = true;
  nav.setPointerCapture?.(pointerId);
  longPressTimer = window.setTimeout(expand, 210);
}

function pointerMove(event) {
  if (!pressing || event.pointerId !== pointerId) return;
  if (!expanded && Math.abs(event.clientX - startX) > 10) clearTimeout(longPressTimer);
  if (expanded) moveSelection(event.clientX);
}

function pointerUp(event) {
  if (event.pointerId !== pointerId) return;
  clearTimeout(longPressTimer);
  pressing = false;
  if (expanded) collapse(true);
  pointerId = null;
}

nav.addEventListener('pointerdown', pointerDown);
nav.addEventListener('pointermove', pointerMove);
nav.addEventListener('pointerup', pointerUp);
nav.addEventListener('pointercancel', pointerUp);
nav.addEventListener('lostpointercapture', () => {
  if (pressing) {
    clearTimeout(longPressTimer);
    pressing = false;
    if (expanded) collapse(true);
    pointerId = null;
  }
});

engine.register('selectCategory', selectCategory);
engine.on('navigation:changed', () => {
  clearTimeout(pageTimer);
  pageTimer = window.setTimeout(() => engine.emit('navigation:settled', CATEGORIES[selected]), 280);
});

renderNav();
renderScreen();
updateClock();
setInterval(updateClock, 1000);
window.addEventListener('resize', updateNav);
