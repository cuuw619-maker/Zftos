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
let dragX = 0;
let timer = 0;
let expanded = false;

function render() {
  items.replaceChildren();
  tabs.forEach(([icon, name], index) => {
    const item = document.createElement('button');
    item.className = 'item';
    item.type = 'button';
    item.dataset.index = index;
    item.innerHTML = `<span class="icon">${icon}</span>`;
    item.addEventListener('click', () => select(index));
    items.appendChild(item);
  });
  update();
}

function selectionCenter(index) {
  const item = items.children[index];
  if (!item) return stack.clientWidth / 2;
  return item.offsetLeft + item.offsetWidth / 2;
}

function updateSelection(animated = true) {
  const target = expanded ? dragX : selectionCenter(selected);
  selection.style.transition = animated ? '' : 'none';
  selection.style.left = `${target}px`;
  if (!animated) requestAnimationFrame(() => selection.style.transition = '');
}

function update() {
  stack.classList.toggle('expanded', expanded);
  [...items.children].forEach((el, i) => {
    el.classList.toggle('selected', i === selected);
    el.classList.toggle('active', i === active);
  });
  if (!expanded) dragX = selectionCenter(selected);
  updateSelection();
  title.textContent = tabs[expanded ? active : selected][1];
}

function select(index) {
  selected = index;
  active = index;
  layer.dataset.screen = index;
  update();
}

function openStack() {
  if (expanded) return;
  expanded = true;
  active = selected;
  hint.classList.add('hidden');
  update();
  requestAnimationFrame(() => {
    dragX = selectionCenter(selected);
    updateSelection(false);
  });
}

function closeStack() {
  clearTimeout(timer);
  if (!expanded) return;
  expanded = false;
  select(active);
}

function move(x) {
  if (!expanded) return;
  const rect = stack.getBoundingClientRect();
  const pad = 12;
  dragX = Math.max(pad, Math.min(stack.clientWidth - pad, x - rect.left));

  let nearest = 0;
  let distance = Infinity;
  [...items.children].forEach((_, i) => {
    const d = Math.abs(selectionCenter(i) - dragX);
    if (d < distance) {
      distance = d;
      nearest = i;
    }
  });
  active = nearest;
  updateSelection();
  [...items.children].forEach((el, i) => el.classList.toggle('active', i === active));
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
