function normalizeHost(value?: string | null): string | null {
  const raw = value?.trim();
  if (!raw) {
    return null;
  }

  const withoutProtocol = raw.replace(/^https?:\/\//iu, "").replace(/\/+$/u, "");
  return withoutProtocol ? withoutProtocol : null;
}

function normalizeBaseUrl(value?: string | null): string | null {
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

function resolveAssetBaseUrl(): string | null {
  const explicitBaseUrl = normalizeBaseUrl(import.meta.env.VITE_PUBLIC_ASSET_BASE_URL);
  if (explicitBaseUrl) {
    return explicitBaseUrl;
  }

  const publicDomainRoot = normalizeHost(import.meta.env.VITE_PUBLIC_DOMAIN_ROOT);
  return publicDomainRoot ? `https://assets.${publicDomainRoot}` : null;
}

export const PUBLIC_ASSET_BASE_URL = resolveAssetBaseUrl();

export function resolveRuntimeAssetUrl(path: string): string {
  if (!path) {
    return path;
  }

  if (/^(?:https?:)?\/\//iu.test(path) || path.startsWith("data:")) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return PUBLIC_ASSET_BASE_URL ? `${PUBLIC_ASSET_BASE_URL}${normalizedPath}` : normalizedPath;
}

export function resolveRuntimeMetaUrl(id: string): string {
  return resolveRuntimeAssetUrl(`/generated/meta/${id}.json`);
}

export function resolveRuntimeVideoUrl(videoId: string): string {
  return resolveRuntimeAssetUrl(`/generated/videos/${videoId}.mp4`);
}
