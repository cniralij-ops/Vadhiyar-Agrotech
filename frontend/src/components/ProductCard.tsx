import React from "react";
import { Link } from "react-router-dom";
import { Product } from "../types";

const ProductCard = ({ product }: { product: Product }) => {

  console.log(product);   // <-- YE LINE ADD KARO

  return (
    <Link to={`/products/${product.slug}`} className="product-card product-card--catalogue">
      <img src={product.image} alt={product.name} />
      <div>
        <h3>{product.name}</h3>
      </div>
      <strong style={{ fontSize: "1.2rem" }}>₹{product.price}</strong>
    </Link>
  );
};

export default ProductCard;
