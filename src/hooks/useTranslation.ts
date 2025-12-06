import { useSettings } from '../contexts/SettingsContext';
import { translations, TranslationKey } from '../i18n/translations';

export function useTranslation() {
  const { language } = useSettings();

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations.vi[key] || key;
  };

  return { t, language };
}
