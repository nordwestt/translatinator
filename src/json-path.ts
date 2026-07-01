export function setAtPath(root: unknown, path: string[], value: unknown): void {
  if (path.length === 0) return;

  let current: unknown = root;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    const nextKey = path[i + 1];
    const container = current as Record<string, unknown>;

    if (
      !(key in container) ||
      container[key] === null ||
      typeof container[key] !== 'object'
    ) {
      container[key] = /^\d+$/.test(nextKey) ? [] : {};
    }

    current = container[key];
  }

  const lastKey = path[path.length - 1];
  const parent = current as Record<string, unknown> | unknown[];

  if (Array.isArray(parent) && /^\d+$/.test(lastKey)) {
    parent[Number(lastKey)] = value;
  } else {
    (parent as Record<string, unknown>)[lastKey] = value;
  }
}
