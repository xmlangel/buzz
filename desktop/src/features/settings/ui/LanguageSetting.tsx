import { useTranslation } from "react-i18next";
import {
  setLanguagePreference,
  useLanguagePreference,
  type LanguagePreference,
} from "@/shared/i18n/languagePreference";
import { SegmentedControl } from "@/shared/ui/segmented-control";
import { SettingsOptionRow } from "./SettingsOptionGroup";

const LANGUAGE_OPTIONS: readonly LanguagePreference[] = ["system", "en", "ko"];

/** Interface language picker: follow the system locale or pin a catalog. */
export function LanguageSetting() {
  const { t } = useTranslation();
  const preference = useLanguagePreference();
  const options = LANGUAGE_OPTIONS.map((value) => ({
    value,
    label: t(`settings.language.${value}`),
  }));

  return (
    <SettingsOptionRow data-testid="language-row">
      <div className="min-w-0">
        <p className="text-sm font-medium">{t("settings.language.title")}</p>
        <p
          className="text-sm font-normal text-muted-foreground/70"
          data-settings-subcopy
        >
          {t("settings.language.description")}
        </p>
      </div>
      <SegmentedControl
        size="wide"
        legend={t("settings.language.title")}
        onValueChange={setLanguagePreference}
        optionTestIdPrefix="language"
        options={options}
        testId="language-control"
        value={preference}
      />
    </SettingsOptionRow>
  );
}
