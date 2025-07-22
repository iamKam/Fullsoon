import { localStoragePrefix } from "common/constants";

class Storage {
  constructor() {
    this.prefix = localStoragePrefix;
  }

  getItem(key) {
    return localStorage.getItem(`${this.prefix}${key}`);
  }

  setItem(key, value) {
    localStorage.setItem(`${this.prefix}${key}`, value);
  }

  removeItem(key) {
    localStorage.removeItem(`${this.prefix}${key}`);
  }

  clear() {
    let tempLng = null;
    if (this.getItem("i18nextLng")) {
      tempLng = this.getItem("i18nextLng");
    }
    localStorage.clear();
    this.setItem("i18nextLng", tempLng);
  }
}

export default new Storage();
