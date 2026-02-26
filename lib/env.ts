function getRawEnv(name: string): string {
  return process.env[name]?.trim() ?? "";
}

export const env = {
  googleMapsApiKey: getRawEnv("GOOGLE_MAPS_API_KEY"),
  geminiApiKey: getRawEnv("GEMINI_API_KEY"),
};

export function requireEnvValue(value: string, variableName: string): string {
  if (!value) {
    throw new Error(`${variableName} is not configured.`);
  }

  return value;
}
