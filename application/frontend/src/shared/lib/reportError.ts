export function reportError(context: string, error: unknown) {
  if (import.meta.env.DEV) {
    console.error(context, error);
    return;
  }
  console.error(context);
}
