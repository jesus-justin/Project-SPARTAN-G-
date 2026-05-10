import { EventEmitter } from 'node:events';

const ogcEvents = new EventEmitter();

ogcEvents.setMaxListeners(50);

export function emitOgcEvent(type, payload = {}) {
  ogcEvents.emit(type, {
    type,
    timestamp: new Date().toISOString(),
    ...payload,
  });
}

export function subscribeOgcEvent(type, listener) {
  ogcEvents.on(type, listener);

  return () => {
    ogcEvents.off(type, listener);
  };
}

export function getOgcEventBus() {
  return ogcEvents;
}