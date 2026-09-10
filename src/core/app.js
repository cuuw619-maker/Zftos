const stack = document.getElementById('floatingStack');
const items = document.getElementById('items');
const selection = document.getElementById('selection');
const title = document.getElementById('screenTitle');
const layer = document.getElementById('screenLayer');
const hint = document.getElementById('hint');

const tabs = [
  ['⌂', 'Главная'],
  ['✦', 'Приложения'],
  ['⌕', 'Поиск'],
  ['◌', 'Уведомления'],
  ['⚙', 'Настройки'],
];

let selected = 0;
let active = 0;
let pointerId = null;
let pressTimer = 0;
let dragging = false;
let dragX = 0;
let springFrame = 0;

function render() {
  items.replaceChildren();
  tabs.forEach(([icon], index) => {
    const item = document.createElement('button');
    item.className = 'item';
    item.type = 'button';
    item.dataset.index = index;
    item.innerHTML = `<span class="icon">${icon}</span>`;
    item.addEventListener('click', () => select(index));
    items.appendChild(item);
  });
  sync();
}

function centerFor(index) {
  const item = items.children[index];
  return item ? item.offsetLeft + item.offsetWidth / 2 : stack.clientWidth / 2;
}

function setSelection(x, animate = true) {
  selection.style.transition = animate ? '' : 'none';
  selection.style.left = `${x}px`;
  if (!animate) requestAnimationFrame(() => selection.style.transition = '');
}

function sync() {
  [...items.children].forEach((el, i) => {
    el.classList.toggle('selected', i === selected);
    el.classList.toggle('active', i === active);
  });
  if (!dragging) setSelection(centerFor(selected));
}

function select(index) {
  selected = index;
  active = index;
  layer.dataset.screen = index;
  sync();
}

function beginPress() {
  if (dragging) return;
  dragging = true;
  active = selected;
  dragX = centerFor(selected);
  stack.classList.add('dragging');
  hint.classList.add('hidden');
  setSelection(dragX, false);
  requestAnimationFrame(() => setSelection(dragX, true));
}

function nearestIndex(x) {
  let nearest = 0;
  let distance = Infinity;
  [...items.children].forEach((_, i) => {
    const d = Math.abs(centerFor(i) - x);
    if (d < distance) {
      distance = d;
      nearest = i;
    }
  });
  return nearest;
}

function move(e) {
  if (!dragging || e.pointerId !== pointerId) return;
  const rect = stack.getBoundingClientRect();
  const radius = 12;
  dragX = Math.max(radius, Math.min(stack.clientWidth - radius, e.clientX - rect.left));
  setSelection(dragX, false);
  active = nearestIndex(dragX);
  [...items.children].forEach((el, i) => el.classList.toggle('active', i === active));
}

function springTo(target) {
  cancelAnimationFrame(springFrame);
  const start = dragX;
  const startTime = performance.now();
  const duration = 360;
  const frame = now => {
    const p = Math.min(1, (now - startTime) / duration);
    const eased = 1 - Math.pow(1 - p, 4);
    dragX = start + (target - start) * eased;
    setSelection(dragX, false);
    if (p < 1) springFrame = requestAnimationFrame(frame);
    else {
      dragX = target;
      setSelection(target, false);
      selected = active;
      dragging = false;
      stack.classList.remove('dragging');
      sync();
    }
  };
  springFrame = requestAnimationFrame(frame);
}

function release(e) {
  if (e.pointerId !== pointerId) return;
  clearTimeout(pressTimer);
  if (dragging) springTo(centerFor(active));
  pointerId = null;
}

stack.addEventListener('pointerdown', e => {
  if (pointerId !== null) return;
  pointerId = e.pointerId;
  stack.setPointerCapture?.(e.pointerId);
  pressTimer = setTimeout(beginPress, 190);
});

stack.addEventListener('pointermove', move);
stack.addEventListener('pointerup', release);
stack.addEventListener('pointercancel', release);
stack.addEventListener('lostpointercapture', () => {
  clearTimeout(pressTimer);
  if (dragging) springTo(centerFor(active));
  pointerId = null;
});

window.addEventListener('resize', () => {
  if (!dragging) sync();
});

render();
