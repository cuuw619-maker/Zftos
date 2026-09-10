import { APPS, DOCK, SYSTEM_APPS } from '../config/apps.js';

const clock = document.getElementById('clock');
const toast = document.getElementById('toast');
const grid = document.getElementById('appGrid');
const dock = document.getElementById('dock');
let toastTimer;

function updateClock() {
  clock.textContent = new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date());
}

function showToast(name) {
  toast.textContent = `${name} — приложение пока не реализовано`;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
}

function createIcon(src, alt, className = 'icon') {
  const image = document.createElement('img');
  image.className = className;
  image.src = src;
  image.alt = alt;
  image.draggable = false;
  image.loading = 'eager';
  image.onerror = () => image.classList.add('icon-missing');
  return image;
}

function createAppButton(app) {
  const button = document.createElement('button');
  button.className = 'app-icon';
  button.dataset.app = app.name;
  button.appendChild(createIcon(app.iconSrc, `${app.name} icon`));
  const label = document.createElement('b');
  label.textContent = app.name;
  button.appendChild(label);
  button.addEventListener('click', () => showToast(app.name));
  return button;
}

function createDockButton(id) {
  const app = APPS.find(item => item.id === id) || SYSTEM_APPS[id];
  if (!app) return;
  const button = document.createElement('button');
  button.className = 'dock-icon';
  button.dataset.app = app.name;
  button.title = app.name;
  button.appendChild(createIcon(app.iconSrc, app.name, 'dock-image'));
  button.addEventListener('click', () => showToast(app.name));
  dock.appendChild(button);
}

APPS.forEach(app => grid.appendChild(createAppButton(app)));
DOCK.forEach(createDockButton);
updateClock();
setInterval(updateClock, 1000);

let startX = 0;
let startY = 0;
let dragging = false;
grid.addEventListener('pointerdown', event => {
  startX = event.clientX;
  startY = event.clientY;
  dragging = true;
});
grid.addEventListener('pointerup', event => {
  if (!dragging) return;
  dragging = false;
  const dx = event.clientX - startX;
  const dy = event.clientY - startY;
  if (Math.abs(dx) > 50 || Math.abs(dy) > 50) {
    grid.style.transform = `translate(${Math.max(-25, Math.min(25, dx / 5))}px,${Math.max(-15, Math.min(15, dy / 5))}px)`;
    setTimeout(() => { grid.style.transform = ''; }, 180);
  }
});
grid.addEventListener('pointercancel', () => { dragging = false; });
