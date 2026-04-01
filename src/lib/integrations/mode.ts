export function getIntegrationMode() {
  return process.env.INTEGRATION_MODE === "live" ? "live" : "mock";
}

export function isMockMode() {
  return getIntegrationMode() === "mock";
}

export function requireLiveEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`${name} is required when INTEGRATION_MODE=live.`);
  }

  return value;
}
