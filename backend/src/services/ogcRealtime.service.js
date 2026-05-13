import { EventEmitter } from 'node:events';

const ogcEvents = new EventEmitter();

ogcEvents.setMaxListeners(50);

export function emitOgcEvent(type, payload = {}) {
  const event = {
    type,
    timestamp: new Date().toISOString(),
    ...payload,
  };

  for (const listener of ogcEvents.listeners(type)) {
    try {
      listener(event);
    } catch (error) {
      console.error(`OGC realtime listener failed for ${type}:`, error);
    }
  }
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