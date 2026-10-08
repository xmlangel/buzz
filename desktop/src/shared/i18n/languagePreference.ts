import * as React from "react";

/** Interface language choice. `system` follows the OS / webview locale. */
export type LanguagePreference = "system" | "en" | "ko";

/** Languages that ship a translation catalog. */
export type SupportedLanguage = Exclude<LanguagePreference, "system">;

export const LANGUAGE_STORAGE_KEY = "buzz.appearance.language";
export const DEFAULT_LANGUAGE_PREFERENCE: LanguagePreference = "system";
export const FALLBACK_LANGUAGE: SupportedLanguage = "en";

const listeners = new Set<() => void>();
let preference: LanguagePreference = DEFAULT_LANGUAGE_PREFERENCE;
let listeningForStorageChanges = false;

export function parseLanguagePreference(
  value: string | null | undefined,
): LanguagePreference {
  return value === "system" || value === "en" || value === "ko"
    ? value
    : DEFAULT_LANGUAGE_PREFERENCE;
}

/** Map BCP 47 tags (e.g. `ko-KR`, `en-US`) to the first shipped catalog. */
export function detectSystemLanguage(
  languages: readonly string[] | undefined,
): SupportedLanguage {
  for (const tag of languages ?? []) {
    const base = tag.toLowerCase().split("-")[0];
    if (base === "ko" || base === "en") return base;
  }
  return FALLBACK_LANGUAGE;
}

function systemLanguages(): readonly string[] {
  const nav = globalThis.navigator;
  if (!nav) return [];
  if (nav.languages?.length) return nav.languages;
  return nav.language ? [nav.language] : [];
}

export function resolveLanguage(
  value: LanguagePreference,
  languages: readonly string[] = systemLanguages(),
): SupportedLanguage {
  return value === "system" ? detectSystemLanguage(languages) : value;
}

function readStoredPreference(): LanguagePreference {
  try {
    return parseLanguagePreference(
      globalThis.localStorage?.getItem(LANGUAGE_STORAGE_KEY),
    );
  } catch {
    return DEFAULT_LANGUAGE_PREFERENCE;
  }
}

function applyDocumentLanguage(value: LanguagePreference): void {
  const root = globalThis.document?.documentElement;
  if (root) root.lang = resolveLanguage(value);
}

function notifyListeners(): void {
  for (const listener of listeners) listener();
}

function applyStoredPreference(): void {
  const next = readStoredPreference();
  const changed = next !== preference;
  preference = next;
  applyDocumentLanguage(next);
  if (changed) notifyListeners();
}

function listenForStorageChanges(): void {
  if (listeningForStorageChanges || !globalThis.window?.addEventListener)
    return;
  globalThis.window.addEventListener("storage", (event) => {
    if (event.key === LANGUAGE_STORAGE_KEY || event.key === null) {
      applyStoredPreference();
    }
  });
  listeningForStorageChanges = true;
}

/** Read the persisted choice before React renders so the first paint is localized. */
export function initializeLanguagePreference(): void {
  applyStoredPreference();
  listenForStorageChanges();
}

export function subscribeLanguagePreference(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getLanguagePreference(): LanguagePreference {
  return preference;
}

export function setLanguagePreference(value: LanguagePreference): void {
  preference = value;
  applyDocumentLanguage(value);
  try {
    globalThis.localStorage?.setItem(LANGUAGE_STORAGE_KEY, value);
  } catch {
    // Persistence is best-effort; the live preference still applies.
  }
  notifyListeners();
}

export function useLanguagePreference(): LanguagePreference {
  return React.useSyncExternalStore(
    subscribeLanguagePreference,
    getLanguagePreference,
    () => DEFAULT_LANGUAGE_PREFERENCE,
  );
}
