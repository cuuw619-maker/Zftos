import { APPS, DOCK, SYSTEM_APPS } from '../config/apps.js';
import { engine } from './engine.js';
import { assets } from './assets.js';

const clock = document.getElementById('clock');
const pages = document.getElementById('pages');
const pageDots = document.getElementById('pageDots');
const dock = document.getElementById('dock');
const appWindow = document.getElementById('appWindow');
const appWindowTitle = document.getElementById('appWindowTitle');
const placeholderName = document.getElementById('placeholderName');
const placeholderIcon = document.getElementById('placeholderIcon');
const launchImage = document.getElementById('launchImage');
const appBack = document.getElementById('appBack');
const os = document.getElementById('os');

const APPS_PER_PAGE = 8;
let currentPage = 0;
let openedApp = null;
let pageScrollFrame = 0;

function updateClock() {
  clock.textContent = new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date());
}

function createIcon(src, alt, className = 'icon') {
  const image = assets.image(src, alt, className);
  image.addEventListener('error', () => {
    image.classList.add('icon-missing');
    image.removeAttribute('src');
  }, { once: true });
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
  pages.replaceChildren();
  pageDots.replaceChildren();
  const pageCount = Math.max(1, Math.ceil(APPS.length / APPS_PER_PAGE));

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
    const page = document.createElement('div');
    page.className = 'desktop-page';
    page.dataset.page = pageIndex;
    APPS.slice(pageIndex * APPS_PER_PAGE, (pageIndex + 1) * APPS_PER_PAGE)
      .forEach(app => page.appendChild(createAppButton(app)));
    pages.appendChild(page);

    const dot = document.createElement('button');
    dot.className = 'page-dot';
    dot.type = 'button';
    dot.setAttribute('aria-label', `Страница ${pageIndex + 1}`);
    dot.addEventListener('click', () => goToPage(pageIndex));
    pageDots.appendChild(dot);
  }
  updatePageDots();
}

function goToPage(page) {
  const max = Math.max(0, pages.children.length - 1);
  currentPage = Math.max(0, Math.min(page, max));
  pages.scrollTo({ left: pages.clientWidth * currentPage, behavior: 'smooth' });
  updatePageDots();
}

function updatePageDots() {
  [...pageDots.children].forEach((dot, index) => {
    dot.classList.toggle('active', index === currentPage);
    dot.setAttribute('aria-current', index === currentPage ? 'page' : 'false');
  });
}

function syncPageFromScroll() {
  cancelAnimationFrame(pageScrollFrame);
  pageScrollFrame = requestAnimationFrame(() => {
    if (!pages.clientWidth) return;
    const raw = pages.scrollLeft / pages.clientWidth;
    const next = Math.max(0, Math.min(Math.round(raw), pages.children.length - 1));
    const progress = Math.max(0, Math.min(1, raw - Math.floor(raw)));
    pages.style.setProperty('--page-progress', progress.toFixed(3));
    [...pages.children].forEach((page, index) => {
      const distance = Math.min(1, Math.abs(index - raw));
      page.style.setProperty('--page-depth', (1 - distance * 0.045).toFixed(3));
      page.style.setProperty('--page-alpha', (1 - distance * 0.12).toFixed(3));
    });
    if (next !== currentPage) {
      currentPage = next;
      updatePageDots();
    }
  });
}

function sourcePoint(sourceButton) {
  const rect = sourceButton.getBoundingClientRect();
  const osRect = os.getBoundingClientRect();
  return {
    x: rect.left - osRect.left + rect.width / 2,
    y: rect.top - osRect.top + rect.height / 2,
    width: rect.width,
    height: rect.height,
  };
}

function openApp(app, sourceButton) {
  if (openedApp || !sourceButton) return;
  openedApp = app;
  const point = sourcePoint(sourceButton);

  appWindow.style.setProperty('--open-x', `${point.x}px`);
  appWindow.style.setProperty('--open-y', `${point.y}px`);
  appWindow.style.setProperty('--icon-w', `${point.width}px`);
  appWindow.style.setProperty('--icon-h', `${point.height}px`);
  appWindowTitle.textContent = app.name;
  placeholderName.textContent = app.name;
  placeholderIcon.replaceChildren(createIcon(app.iconSrc, app.name, 'placeholder-image'));
  launchImage.src = assets.resolve(app.iconSrc);
  launchImage.alt = '';
  appWindow.setAttribute('aria-hidden', 'false');
  appWindow.classList.remove('closing');
  sourceButton.classList.add('launching');
  requestAnimationFrame(() => appWindow.classList.add('open'));
  engine.set('activeApp', app.id);
  engine.emit('app:open', app);
}

function closeApp() {
  if (!openedApp) return;
  const closingApp = openedApp;
  appWindow.classList.remove('open');
  appWindow.classList.add('closing');
  engine.emit('app:close', closingApp);
  const finish = () => {
    appWindow.classList.remove('closing');
    appWindow.setAttribute('aria-hidden', 'true');
    launchImage.removeAttribute('src');
    openedApp = null;
    engine.set('activeApp', null);
  };
  appWindow.addEventListener('animationend', event => {
    if (event.animationName === 'app-close') finish();
  }, { once: true });
}

engine.register('launch', openApp);
engine.register('close', closeApp);
pages.addEventListener('scroll', syncPageFromScroll, { passive: true });
appBack.addEventListener('click', closeApp);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && openedApp) closeApp();
  if (!openedApp && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
    goToPage(currentPage + (event.key === 'ArrowRight' ? 1 : -1));
  }
});

buildPages();
dock.replaceChildren();
DOCK.forEach(createDockButton);
updateClock();
setInterval(updateClock, 1000);
