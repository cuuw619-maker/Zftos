export class AssetManager {
  constructor() {
    this.cache = new Map();
    this.base = new URL('../../', import.meta.url);
  }

  resolve(path) {
    if (!path) return '';
    return new URL(path.replace(/^\/+/, ''), this.base).href;
  }

  loadImage(path) {
    const key = String(path || '');
    if (this.cache.has(key)) return this.cache.get(key);
    const promise = new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Asset failed to load: ${key}`));
      image.src = this.resolve(key);
    });
    this.cache.set(key, promise);
    return promise;
  }

  image(path, alt = '', className = '') {
    const image = document.createElement('img');
    image.className = className;
    image.alt = alt;
    image.draggable = false;
    image.decoding = 'async';
    image.loading = 'eager';
    image.src = this.resolve(path);
    return image;
  }
}

export const assets = new AssetManager();
