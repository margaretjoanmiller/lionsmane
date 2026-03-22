// ensures the the given key of an object exists. works on .filter
export function hasDefinedProp<T, K extends keyof T>(key: K) {
  return (obj: T): obj is T & { [P in K]-?: NonNullable<T[P]> } =>
    obj[key] != null;
}
