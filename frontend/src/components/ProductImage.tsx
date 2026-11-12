import { useState } from "react";
import { useTranslation } from "../contexts/LanguageContext";

interface ProductImageProps {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
}

const ProductImage = ({ src, alt, priority = false, className = "" }: ProductImageProps) => {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const unavailable = !src || failedSrc === src;
  const t = useTranslation();

  return (
    <div className={`product-card__media${className ? ` ${className}` : ""}${unavailable ? " product-card__media--fallback" : ""}`}>
      {unavailable ? (
        <div className="product-card__image-fallback" role="img" aria-label={`${alt}: ${t("imageUnavailable")}`}>
          <svg viewBox="0 0 48 48" aria-hidden="true">
            <path d="M24 39c0-14 6-24 18-30-1 16-6 26-18 30Z" />
            <path d="M24 39C23 27 17 20 7 17c1 12 6 19 17 22Z" />
            <path d="M24 40V24" />
          </svg>
          <span>{t("imageUnavailable")}</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onError={() => setFailedSrc(src)}
        />
      )}
    </div>
  );
};

export default ProductImage;
