import type en from "./en";

export type TranslationKey = keyof typeof en;
export type Translations = Partial<Record<TranslationKey, string>>;
