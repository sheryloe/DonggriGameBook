import { APP_ORIGINS, type AppId } from "./catalog";

type EnvLike = Record<string, string | undefined>;

const APP_PUBLIC_SUBDOMAINS: Record<AppId, string> = {
  "donggrolgamebook-p1": "p1",
  "donggrolgamebook-p2": "p2",
  "donggrolgamebook-p3": "p3",
  "donggrolgamebook-p4": "p4"
};

const APP_ENV_SUFFIXES: Record<AppId, string> = {
  "donggrolgamebook-p1": "P1",
  "donggrolgamebook-p2": "P2",
  "donggrolgamebook-p3": "P3",
  "donggrolgamebook-p4": "P4"
};

function normalizeOrigin(value?: string | null): string | null {
  const raw = value?.trim();
  if (!raw) {
    return null;
  }

  const withProtocol = /^https?:\/\//iu.test(raw) ? raw : `https://${raw}`;

  try {
    const url = new URL(withProtocol);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return url.origin.replace(/\/$/u, "");
  } catch {
    return null;
  }
}

function normalizeHost(value?: string | null): string | null {
  const origin = normalizeOrigin(value);
  if (origin) {
    return origin.replace(/^https?:\/\//iu, "");
  }

  const raw = value?.trim().replace(/^https?:\/\//iu, "").replace(/\/+$/u, "");
  return raw ? raw : null;
}

function dedupeOrigins(origins: Array<string | null | undefined>): string[] {
  return [...new Set(origins.filter((origin): origin is string => Boolean(origin)))];
}

export function getPublicWebOrigins(env: EnvLike = process.env): Record<AppId, string[]> {
  const rootDomain = normalizeHost(env.PUBLIC_WEB_DOMAIN_ROOT ?? env.PUBLIC_DOMAIN_ROOT);

  return (Object.keys(APP_ORIGINS) as AppId[]).reduce<Record<AppId, string[]>>((accumulator, appId) => {
    const explicitOrigin = normalizeOrigin(env[`PUBLIC_WEB_ORIGIN_${APP_ENV_SUFFIXES[appId]}`]);
    const derivedOrigin = rootDomain ? `https://${APP_PUBLIC_SUBDOMAINS[appId]}.${rootDomain}` : null;

    accumulator[appId] = dedupeOrigins([explicitOrigin, derivedOrigin]);
    return accumulator;
  }, {} as Record<AppId, string[]>);
}

export function getPublicAssetBaseUrl(env: EnvLike = process.env): string | null {
  const explicit = normalizeOrigin(env.PUBLIC_ASSET_BASE_URL);
  if (explicit) {
    return explicit;
  }

  const rootDomain = normalizeHost(env.PUBLIC_ASSET_DOMAIN_ROOT ?? env.PUBLIC_DOMAIN_ROOT ?? env.PUBLIC_WEB_DOMAIN_ROOT);
  return rootDomain ? `https://assets.${rootDomain}` : null;
}

export function getPublicApiBaseUrl(env: EnvLike = process.env): string | null {
  const explicit = normalizeOrigin(env.PUBLIC_API_BASE_URL);
  if (explicit) {
    return explicit;
  }

  const rootDomain = normalizeHost(env.PUBLIC_API_DOMAIN_ROOT ?? env.PUBLIC_DOMAIN_ROOT ?? env.PUBLIC_WEB_DOMAIN_ROOT);
  return rootDomain ? `https://api.${rootDomain}` : null;
}

export function getAllAllowedOrigins(
  env: EnvLike = process.env,
  extraOrigins: Array<string | null | undefined> = []
): string[] {
  const publicOrigins = Object.values(getPublicWebOrigins(env)).flatMap((origins) => origins);
  const tossOrigins = Object.values(APP_ORIGINS).flatMap((origins) => [...origins]);

  return dedupeOrigins([...tossOrigins, ...publicOrigins, ...extraOrigins]);
}
