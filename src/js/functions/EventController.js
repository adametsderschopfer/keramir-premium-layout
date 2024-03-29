;(() => {
  class EventController {
    constructor() {
      this._events = {};
    }

    on(name, listener) {
      if (!this._events[name]) {
        this._events[name] = [];
      }

      this._events[name].push(listener);
    }

    removeListener(name, listenerToRemove) {
      if (!this._events[name]) {
        console.warn(`Can't remove a listener. Event "${name}" doesn't exits.`);
        return;
      }

      const filterListeners = (listener) => listener !== listenerToRemove;

      this._events[name] = this._events[name].filter(filterListeners);
    }

    emit(name, data) {
      if (!this._events[name]) {
        console.warn(`Can't emit an event. Event "${name}" doesn't exits.`);
        return;
      }

      const fireCallbacks = (callback) => {
        callback(data);
      };

      this._events[name].forEach(fireCallbacks);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    window.EventController = new EventController();
  }, true);
})();