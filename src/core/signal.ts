type Subscriber<T> = (v: T) => void;

type Signal<T> = {
  get: () => T;
  set: (v: T) => void;
  subscribe: (fn: Subscriber<T>) => () => void;
  subscribeOnce: (fn: Subscriber<T>) => void;
  clear: () => void;
};

export function signal<T>(value: T): Signal<T> {
  const subs = new Set<Subscriber<T>>();
  return {
    get: () => value,
    set: (v: T) => {
      value = v;
      for (const fn of subs) {
        fn(v);
      }
    },
    subscribe: (fn: Subscriber<T>) => {
      subs.add(fn);
      return () => subs.delete(fn);
    },
    subscribeOnce: (fn: Subscriber<T>) => {
      const wrap: Subscriber<T> = (v) => {
        fn(v);
        subs.delete(wrap);
      };
      subs.add(wrap);
    },
    clear: () => subs.clear(),
  };
}
