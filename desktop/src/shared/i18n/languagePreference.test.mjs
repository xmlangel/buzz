import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const values = new Map();
const windowListeners = new Map();
const root = { lang: "" };

globalThis.window = {
  addEventListener: (type, listener) => windowListeners.set(type, listener),
};
globalThis.localStorage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, String(value)),
};
globalThis.document = { documentElement: root };
Object.defineProperty(globalThis, "navigator", {
  configurable: true,
  value: { languages: ["ko-KR", "en-US"], language: "ko-KR" },
});

const preference = await import("./languagePreference.ts");

test("parses only known preferences and defaults to system", () => {
  assert.equal(preference.parseLanguagePreference("ko"), "ko");
  assert.equal(preference.parseLanguagePreference("en"), "en");
  assert.equal(preference.parseLanguagePreference("system"), "system");
  assert.equal(preference.parseLanguagePreference("fr"), "system");
  assert.equal(preference.parseLanguagePreference(null), "system");
});

test("detects the first shipped catalog from BCP 47 tags", () => {
  assert.equal(preference.detectSystemLanguage(["ko-KR"]), "ko");
  assert.equal(preference.detectSystemLanguage(["fr-FR", "ko"]), "ko");
  assert.equal(preference.detectSystemLanguage(["EN-gb"]), "en");
  assert.equal(preference.detectSystemLanguage(["ja-JP"]), "en");
  assert.equal(preference.detectSystemLanguage([]), "en");
});

test("system preference resolves through navigator languages", () => {
  preference.initializeLanguagePreference();
  assert.equal(preference.getLanguagePreference(), "system");
  assert.equal(root.lang, "ko");
});

test("persists the choice, updates <html lang>, and notifies subscribers", () => {
  let notified = 0;
  const unsubscribe = preference.subscribeLanguagePreference(() => {
    notified += 1;
  });

  preference.setLanguagePreference("en");

  assert.equal(values.get(preference.LANGUAGE_STORAGE_KEY), "en");
  assert.equal(preference.getLanguagePreference(), "en");
  assert.equal(root.lang, "en");
  assert.equal(notified, 1);
  unsubscribe();
});

test("applies changes made in another window via the storage event", () => {
  values.set(preference.LANGUAGE_STORAGE_KEY, "ko");
  windowListeners.get("storage")({ key: preference.LANGUAGE_STORAGE_KEY });

  assert.equal(preference.getLanguagePreference(), "ko");
  assert.equal(root.lang, "ko");
});

test("every English key has a Korean translation and vice versa", () => {
  const read = (name) =>
    JSON.parse(
      readFileSync(new URL(`./locales/${name}.json`, import.meta.url), "utf8"),
    );
  const keys = (object, prefix = "") =>
    Object.entries(object).flatMap(([key, value]) =>
      typeof value === "object"
        ? keys(value, `${prefix}${key}.`)
        : [`${prefix}${key}`],
    );
  assert.deepEqual(keys(read("ko")).sort(), keys(read("en")).sort());
});
