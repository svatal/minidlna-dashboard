export function isDefined<T>(e: T | null | undefined): e is T {
  return e !== null && e !== undefined;
}

export function first<T>(a: T[]): T | null {
  if (a.length === 0) return null;
  return a[0];
}
