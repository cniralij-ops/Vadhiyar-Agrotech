import { Link } from "react-router-dom";
import { Product } from "../types";
import ProductImage from "./ProductImage";
import { useTranslation } from "../contexts/LanguageContext";

const ProductCard = ({ product, priority = false }: { product: Product; priority?: boolean }) => {
  const t = useTranslation();
  return (
    <Link to={`/products/${product.slug}`} className="product-card product-card--catalogue">
      <ProductImage src={product.image} alt={product.name} priority={priority} />
      <div className="product-card__details">
        <span className="product-card__category">{product.category.name}</span>
        {(product.isFeatured || !product.isAvailable || product.stock <= 0) && (
          <div className="product-card__flags">
            {product.isFeatured && <span className="tag">{t("featuredLabel")}</span>}
            {(!product.isAvailable || product.stock <= 0) && <span className="tag tag--muted">{t("outOfStock")}</span>}
          </div>
        )}
        <h3>{product.name}</h3>
        <strong className="product-card__price">₹{product.price.toLocaleString("en-IN")}</strong>
      </div>
    </Link>
  );
};

export default ProductCard;

