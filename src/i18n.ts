import i18n from "i18next";
import Backend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import storage from "services/storage";
import { localStoragePrefix } from "common/constants";

const languageDetector = new LanguageDetector();

languageDetector.addDetector({
  name: "customDetectorsLng",

  lookup() {
    const navigatorLng = window.navigator.language;
    const storageLng = storage.getItem("i18nextLng");
    return (storageLng || navigatorLng || "en")?.split("-")[0];
  },

  cacheUserLanguage(_lng, _options) {
    // options -> are passed in options
    // lng -> current language, will be called after init and on changeLanguage
    // store it
  },
});

i18n
  .use(Backend)
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    backend: { loadPath: "locales/{{lng}}/{{ns}}.json" },
    fallbackLng: "en",
    debug: false,
    detection: {
      lookupLocalStorage: `${localStoragePrefix}i18nextLng`,
      order: ["customDetectorsLng", "navigator"],
      lookupQuerystring: "lng",
    },
    load: "languageOnly",
    lowerCaseLng: true,

    // have a common namespace used around the full app
    ns: ["translations"],
    defaultNS: "translations",

    keySeparator: false, // we use content as keys
    supportedLngs: ["en", "es", "fr"],
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
