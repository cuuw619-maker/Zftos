export class ZftEngine {
  constructor() {
    this.actions = new Map();
    this.state = new Map();
    this.events = new EventTarget();
    this.modules = new Map();
    this.raf = 0;
    this.lastFrame = performance.now();
    this.frameHandlers = new Set();
  }

  register(name, handler) {
    if (typeof handler !== 'function') throw new TypeError(`Action '${name}' must be a function`);
    const handlers = this.actions.get(name) || new Set();
    handlers.add(handler);
    this.actions.set(name, handlers);
    return () => {
      handlers.delete(handler);
      if (!handlers.size) this.actions.delete(name);
    };
  }

  dispatch(name, ...args) {
    const handlers = this.actions.get(name);
    if (!handlers) return undefined;
    let result;
    for (const handler of handlers) result = handler(...args);
    return result;
  }

  set(key, value) {
    this.state.set(key, value);
    this.emit(`state:${key}`, value);
    return value;
  }

  get(key, fallback = undefined) {
    return this.state.has(key) ? this.state.get(key) : fallback;
  }

  update(key, updater, fallback) {
    return this.set(key, updater(this.get(key, fallback)));
  }

  on(type, listener) {
    this.events.addEventListener(type, listener);
    return () => this.events.removeEventListener(type, listener);
  }

  emit(type, detail = undefined) {
    this.events.dispatchEvent(new CustomEvent(type, { detail }));
  }

  use(name, module) {
    if (!module) throw new TypeError(`Engine module '${name}' is empty`);
    if (typeof module.init === 'function') module.init(this);
    this.modules.set(name, module);
    return module;
  }

  addFrameHandler(handler) {
    this.frameHandlers.add(handler);
    this.start();
    return () => this.frameHandlers.delete(handler);
  }

  start() {
    if (this.raf) return;
    this.lastFrame = performance.now();
    const frame = now => {
      this.raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - this.lastFrame) / 1000);
      this.lastFrame = now;
      for (const handler of this.frameHandlers) handler(dt, now);
      this.emit('frame', { dt, now });
    };
    this.raf = requestAnimationFrame(frame);
  }

  launch(app, source) { return this.dispatch('launch', app, source); }
  close() { return this.dispatch('close'); }
}

export const engine = new ZftEngine();
