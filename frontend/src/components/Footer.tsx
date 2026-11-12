import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "../contexts/LanguageContext";
import { BUSINESS_INFO } from "../data/businessInfo";

const Footer = () => {
  const t = useTranslation();
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <strong>{BUSINESS_INFO.name}</strong>
          <p>{t("footerTag")}</p>
          <p lang="gu">{BUSINESS_INFO.legalNameGujarati}</p>
        </div>
        <div className="site-footer__contact">
          <p>{t("supportLine")}</p>
          <a href={BUSINESS_INFO.phoneLink}>{BUSINESS_INFO.phone}</a>
          <a href={`mailto:${BUSINESS_INFO.email}`}>{BUSINESS_INFO.email}</a>
          <p>{BUSINESS_INFO.address}</p>
        </div>
        <div className="site-footer__links">
          <Link to="/contact">{t("contactUs")}</Link>
          <Link to="/owner">{t("ownerLogin")}</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

