import React from "react";
import { useTranslation } from "../contexts/LanguageContext";

const Footer = () => {
  const t = useTranslation();
  return (
    <footer>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <strong>Vadhiyar Agrotech</strong>
          <p>{t("footerTag")}</p>
        </div>
        <div>
          <p>{t("supportLine")}</p>
          <p>support@vadhiyaragrotech.com</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
