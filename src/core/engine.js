export class ZftEngine {
  constructor() {
    this.actions = new Map();
    this.state = new Map();
    this.events = new EventTarget();
  }

  register(name, handler) {
    if (typeof handler !== 'function') throw new TypeError(`Action '${name}' must be a function`);
    this.actions.set(name, handler);
    return () => this.actions.delete(name);
  }

  dispatch(name, ...args) {
    const handler = this.actions.get(name);
    if (!handler) return undefined;
    return handler(...args);
  }

  set(key, value) {
    this.state.set(key, value);
    this.events.dispatchEvent(new CustomEvent(`state:${key}`, { detail: value }));
    return value;
  }

  get(key, fallback = undefined) {
    return this.state.has(key) ? this.state.get(key) : fallback;
  }

  on(type, listener) {
    this.events.addEventListener(type, listener);
    return () => this.events.removeEventListener(type, listener);
  }

  launch(app, source) {
    return this.dispatch('launch', app, source);
  }

  close() {
    return this.dispatch('close');
  }
}

export const engine = new ZftEngine();
