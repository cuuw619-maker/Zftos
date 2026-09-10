import { APPS, DOCK, SYSTEM_APPS } from '../config/apps.js';

const clock = document.getElementById('clock');
const grid = document.getElementById('appGrid');
const dock = document.getElementById('dock');

function updateClock() {
  clock.textContent = new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date());
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
  button.type = 'button';
  button.dataset.app = app.name;
  button.appendChild(createIcon(app.iconSrc, `${app.name} icon`));
  const label = document.createElement('b');
  label.textContent = app.name;
  button.appendChild(label);
  return button;
}

function createDockButton(id) {
  const app = APPS.find(item => item.id === id) || SYSTEM_APPS[id];
  if (!app) return;
  const button = document.createElement('button');
  button.className = 'dock-icon';
  button.type = 'button';
  button.dataset.app = app.name;
  button.title = app.name;
  button.appendChild(createIcon(app.iconSrc, app.name, 'dock-image'));
  dock.appendChild(button);
}

APPS.forEach(app => grid.appendChild(createAppButton(app)));
DOCK.forEach(createDockButton);
updateClock();
setInterval(updateClock, 1000);
