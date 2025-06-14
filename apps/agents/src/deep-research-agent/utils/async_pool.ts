export function asyncPool<T, R>(poolLimit: number, iterable: T[], iteratorFn: (item: T, iterable: T[]) => Promise<R>): Promise<R[]> {
  let i = 0;
  const ret: Promise<R>[] = [];
  const executing = new Set<Promise<R>>();
  const enqueue = function(): Promise<void> {
    if (i === iterable.length) {
      return Promise.resolve();
    }
    const item = iterable[i++];
    const p = Promise.resolve().then(() => iteratorFn(item, iterable));
    ret.push(p);
    executing.add(p);
    const clean = () => executing.delete(p);
    p.then(clean).catch(clean);
    let r = Promise.resolve();
    if (executing.size >= poolLimit) {
      r = Promise.race(executing).then(() => {});
    }
    return r.then(() => enqueue());
  };
  return enqueue().then(() => Promise.all(ret));
}