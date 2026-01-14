export function compareObjects(
  oldObj: Record<string, any>,
  newObj: Record<string, any>
): { field: string; oldValue: any; newValue: any }[] {
  const changes: { field: string; oldValue: any; newValue: any }[] = [];

  for (const key in newObj) {
    if (key === 'updated_at' || key === 'created_at') continue;

    if (oldObj[key] !== newObj[key]) {
      changes.push({
        field: key,
        oldValue: oldObj[key],
        newValue: newObj[key],
      });
    }
  }

  return changes;
}
