import { BUSINESS_INFO } from "../data/businessInfo";
import { useTranslation } from "../contexts/LanguageContext";

const ContactPage = () => {
  const t = useTranslation();
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(BUSINESS_INFO.address)}`;
  const whatsappUrl = `https://wa.me/${BUSINESS_INFO.whatsappNumber}?text=${encodeURIComponent(`Hello ${BUSINESS_INFO.name}, I have a product enquiry.`)}`;

  return (
    <section className="contact-page" aria-labelledby="contact-title">
      <div className="contact-page__intro">
        <span className="products-eyebrow">{t("contactUs")}</span>
        <h1 id="contact-title">{BUSINESS_INFO.name}</h1>
        <p>{t("contactIntro")}</p>
      </div>

      <div className="contact-grid">
        <a className="contact-card" href={BUSINESS_INFO.phoneLink}>
          <span className="contact-card__label">{t("businessPhone")}</span>
          <strong>{BUSINESS_INFO.phone}</strong>
          <span>{t("callNow")}</span>
        </a>
        <a className="contact-card" href={whatsappUrl} target="_blank" rel="noreferrer">
          <span className="contact-card__label">WhatsApp</span>
          <strong>{BUSINESS_INFO.phone}</strong>
          <span>{t("whatsappUs")}</span>
        </a>
        <a className="contact-card" href={`mailto:${BUSINESS_INFO.email}`}>
          <span className="contact-card__label">{t("businessEmail")}</span>
          <strong>{BUSINESS_INFO.email}</strong>
          <span>{t("emailUs")}</span>
        </a>
        <a className="contact-card" href={mapUrl} target="_blank" rel="noreferrer">
          <span className="contact-card__label">{t("businessAddress")}</span>
          <strong>{BUSINESS_INFO.address}</strong>
          <span>{t("viewMap")}</span>
        </a>
      </div>

      <section className="contact-business" aria-label={t("services")}>
        <div>
          <span className="products-eyebrow">{t("proprietor")}</span>
          <h2>{BUSINESS_INFO.owner}</h2>
          <p className="contact-business__legal" lang="gu">{BUSINESS_INFO.legalNameGujarati}</p>
          <p className="contact-business__address" lang="gu">{BUSINESS_INFO.addressGujarati}</p>
        </div>
        <div>
          <h3>{t("services")}</h3>
          <ul className="about-section__services">
            {BUSINESS_INFO.services.map((service) => <li key={service}>{service}</li>)}
          </ul>
        </div>
      </section>
    </section>
  );
};

export default ContactPage;
