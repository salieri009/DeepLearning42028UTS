let logErrorsEnabled = true;

export function setLogErrorsEnabled(enabled: boolean) {
  logErrorsEnabled = enabled;
}

export function reportError(context: string, error: unknown) {
  if (!logErrorsEnabled && !import.meta.env.DEV) {
    return;
  }
  if (import.meta.env.DEV) {
    console.error(context, error);
    return;
  }
  console.error(context);
}
