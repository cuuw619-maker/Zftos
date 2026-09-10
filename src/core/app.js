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
let startX = 0;
let timer = 0;
let expanded = false;

function render() {
  items.replaceChildren();
  tabs.forEach(([icon, name], index) => {
    const item = document.createElement('button');
    item.className = 'item';
    item.type = 'button';
    item.dataset.index = index;
    item.innerHTML = `<span class="icon">${icon}</span><span class="label">${name}</span>`;
    item.addEventListener('click', () => select(index));
    items.appendChild(item);
  });
  update();
}

function update() {
  stack.classList.toggle('expanded', expanded);
  [...items.children].forEach((el, i) => {
    el.classList.toggle('selected', i === selected);
    el.classList.toggle('active', i === active);
  });
  const target = items.children[expanded ? active : selected];
  if (target) {
    const a = stack.getBoundingClientRect();
    const b = target.getBoundingClientRect();
    selection.style.width = `${b.width}px`;
    selection.style.height = `${b.height}px`;
    selection.style.transform = `translate(${b.left-a.left}px,${b.top-a.top}px)`;
  }
  title.textContent = tabs[expanded ? active : selected][1];
}

function select(index) {
  selected = index;
  active = index;
  layer.dataset.screen = index;
  title.classList.remove('change');
  void title.offsetWidth;
  title.classList.add('change');
  update();
}

function openStack() {
  if (expanded) return;
  expanded = true;
  active = selected;
  hint.classList.add('hidden');
  update();
}

function closeStack() {
  clearTimeout(timer);
  if (!expanded) return;
  expanded = false;
  select(active);
  update();
}

function move(x) {
  if (!expanded) return;
  const rect = stack.getBoundingClientRect();
  const inset = 18;
  const ratio = Math.max(0, Math.min(1, (x - rect.left - inset) / Math.max(1, rect.width - inset * 2)));
  active = Math.round(ratio * (tabs.length - 1));
  update();
}

stack.addEventListener('pointerdown', e => {
  if (pointerId !== null) return;
  pointerId = e.pointerId;
  startX = e.clientX;
  stack.setPointerCapture?.(pointerId);
  timer = setTimeout(openStack, 190);
});

stack.addEventListener('pointermove', e => {
  if (e.pointerId !== pointerId) return;
  if (!expanded && Math.abs(e.clientX - startX) > 12) clearTimeout(timer);
  move(e.clientX);
});

function release(e) {
  if (e.pointerId !== pointerId) return;
  clearTimeout(timer);
  if (expanded) closeStack();
  pointerId = null;
}

stack.addEventListener('pointerup', release);
stack.addEventListener('pointercancel', release);
stack.addEventListener('lostpointercapture', () => {
  clearTimeout(timer);
  if (expanded) closeStack();
  pointerId = null;
});

window.addEventListener('resize', update);
render();
