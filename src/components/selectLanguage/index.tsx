import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dropdown } from "react-bootstrap";

import storage from "services/storage";
import { LANGUAGES } from "common/constants";

import ENFlag from "assets/images/flags/eng.svg";
import FRFlag from "assets/images/flags/fr.svg";
import ESFlag from "assets/images/flags/es.svg";

const FLAG_MAPPING = {
  en: ENFlag,
  fr: FRFlag,
  es: ESFlag,
};
const TRANSLATION_LANGUAGE = "i18nextLng";

function SelectLanguage() {
  const { i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(
    storage.getItem(TRANSLATION_LANGUAGE)
  );

  const handleLanguageSelect = (ev) => {
    const lngOnly = ev;
    i18n.changeLanguage(lngOnly);
    setSelectedLanguage(lngOnly);
    storage.setItem(TRANSLATION_LANGUAGE, lngOnly);
  };

  return (
    <Dropdown
      className="ps-0 pe-0 d-flex justify-content-end"
      onSelect={handleLanguageSelect}
    >
      <Dropdown.Toggle
        variant="button"
        className="dropdown-toggle btn-icon currency-dropdown fw-bold"
      >
        <img
          src={FLAG_MAPPING[selectedLanguage as string]}
          alt="..."
          className="r-image"
        />
        <span className="lng-txt">
          {LANGUAGES.find(
            (l) => selectedLanguage === l.code
          )?.code?.toUpperCase() ?? "Language"}
          &nbsp; &nbsp;
        </span>
      </Dropdown.Toggle>

      <Dropdown.Menu>
        {LANGUAGES.map((c, i) => (
          <Dropdown.Item key={i} eventKey={c.code}>
            <span className="btn-icon ">
              <img src={FLAG_MAPPING[c.code]} alt="..." />
              {c.code?.toUpperCase()}
            </span>
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}

export default SelectLanguage;
