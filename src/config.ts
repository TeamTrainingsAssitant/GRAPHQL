// Zentrale Konfiguration: liest alle Einstellungen aus Umgebungsvariablen (siehe .env.example)

function list(value: string | undefined, fallback: string[]): string[] {
  if (!value) return fallback;
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  backendBaseUrl: process.env.BACKEND_BASE_URL ?? 'http://localhost:8080/api/v1',
  corsOrigins: list(process.env.CORS_ORIGINS, [
    'http://localhost:4200',
    'http://localhost:5500',
    'http://localhost:8000',
  ]),
  cacheTtlSeconds: Number(process.env.CACHE_TTL_SECONDS ?? 300),
};
