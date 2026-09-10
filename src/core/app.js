import { APPS, DOCK, SYSTEM_APPS } from '../config/apps.js';
import { ZftEngine } from './engine.js';

const engine = new ZftEngine();
const clock = document.getElementById('clock');
const pages = document.getElementById('pages');
const pageDots = document.getElementById('pageDots');
const dock = document.getElementById('dock');
const appWindow = document.getElementById('appWindow');
const appWindowTitle = document.getElementById('appWindowTitle');
const placeholderName = document.getElementById('placeholderName');
const placeholderIcon = document.getElementById('placeholderIcon');
const appBack = document.getElementById('appBack');
const os = document.getElementById('os');

const APPS_PER_PAGE = 8;
let currentPage = 0;
let openedApp = null;

function updateClock() {
  clock.textContent = new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date());
}

function resolveIcon(src) {
  return new URL(`../../${src}`, import.meta.url).href;
}

function createIcon(src, alt, className = 'icon') {
  const image = document.createElement('img');
  image.className = className;
  image.src = resolveIcon(src);
  image.alt = alt;
  image.draggable = false;
  image.loading = 'eager';
  image.onerror = () => {
    image.classList.add('icon-missing');
    image.removeAttribute('src');
  };
  return image;
}

function createAppButton(app) {
  const button = document.createElement('button');
  button.className = 'app-icon';
  button.type = 'button';
  button.dataset.app = app.id;
  button.appendChild(createIcon(app.iconSrc, `${app.name} icon`));
  const label = document.createElement('b');
  label.textContent = app.name;
  button.appendChild(label);
  button.addEventListener('click', () => engine.launch(app, button));
  return button;
}

function createDockButton(id) {
  const app = APPS.find(item => item.id === id) || SYSTEM_APPS[id];
  if (!app) return;
  const button = document.createElement('button');
  button.className = 'dock-icon';
  button.type = 'button';
  button.dataset.app = app.id;
  button.title = app.name;
  button.appendChild(createIcon(app.iconSrc, app.name, 'dock-image'));
  button.addEventListener('click', () => engine.launch(app, button));
  dock.appendChild(button);
}

function buildPages() {
  for (let i = 0; i < APPS.length; i += APPS_PER_PAGE) {
    const page = document.createElement('div');
    page.className = 'desktop-page';
    page.dataset.page = i / APPS_PER_PAGE;
    APPS.slice(i, i + APPS_PER_PAGE).forEach(app => page.appendChild(createAppButton(app)));
    pages.appendChild(page);

    const dot = document.createElement('button');
    dot.className = 'page-dot';
    dot.type = 'button';
    dot.setAttribute('aria-label', `Страница ${i / APPS_PER_PAGE + 1}`);
    dot.addEventListener('click', () => goToPage(i / APPS_PER_PAGE));
    pageDots.appendChild(dot);
  }
  updatePageDots();
}

function goToPage(page) {
  currentPage = Math.max(0, Math.min(page, pages.children.length - 1));
  pages.scrollTo({ left: pages.clientWidth * currentPage, behavior: 'smooth' });
  updatePageDots();
}

function updatePageDots() {
  [...pageDots.children].forEach((dot, index) => dot.classList.toggle('active', index === currentPage));
}

function syncPageFromScroll() {
  if (!pages.clientWidth) return;
  const next = Math.round(pages.scrollLeft / pages.clientWidth);
  if (next !== currentPage) {
    currentPage = next;
    updatePageDots();
  }
}

function openApp(app, sourceButton) {
  if (openedApp) return;
  openedApp = app;
  const rect = sourceButton.getBoundingClientRect();
  const osRect = os.getBoundingClientRect();
  const x = rect.left - osRect.left + rect.width / 2;
  const y = rect.top - osRect.top + rect.height / 2;

  appWindow.style.setProperty('--open-x', `${x}px`);
  appWindow.style.setProperty('--open-y', `${y}px`);
  appWindowTitle.textContent = app.name;
  placeholderName.textContent = app.name;
  placeholderIcon.replaceChildren(createIcon(app.iconSrc, app.name, 'placeholder-image'));
  appWindow.setAttribute('aria-hidden', 'false');
  appWindow.classList.remove('closing');
  requestAnimationFrame(() => appWindow.classList.add('open'));
}

function closeApp() {
  if (!openedApp) return;
  appWindow.classList.remove('open');
  appWindow.classList.add('closing');
  appWindow.addEventListener('animationend', () => {
    appWindow.classList.remove('closing');
    appWindow.setAttribute('aria-hidden', 'true');
    openedApp = null;
  }, { once: true });
}

engine.register('launch', openApp);
engine.register('close', closeApp);
pages.addEventListener('scroll', syncPageFromScroll, { passive: true });
appBack.addEventListener('click', closeApp);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && openedApp) closeApp();
});

buildPages();
DOCK.forEach(createDockButton);
updateClock();
setInterval(updateClock, 1000);
