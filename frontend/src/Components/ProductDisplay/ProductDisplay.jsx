import React, { useContext } from "react";
import "./ProductDisplay.css";
import start_icon from "../Assets/star_icon.png";
import start_dull_icon from "../Assets/star_dull_icon.png";
import { ShopContext } from "../../Context/ShopContext";

const ProductDisplay = (props) => {
  const { product } = props;
  const { addToCart } = useContext(ShopContext);

  // Fallback image for missing or broken image links
  const handleImageError = (e) => {
    e.target.src = "http://localhost:4005/images/default-placeholder.png";
  };

  return (
    <div className="productdisplay">
      <div className="productdisplay-left">
        {/* Product Thumbnails */}
        <div className="productdisplay-img-list">
          {[...Array(4)].map((_, index) => (
            <img
              key={index}
              src={
                product.image ||
                "http://localhost:4005/images/default-placeholder.png"
              }
              alt={`Thumbnail ${index + 1}`}
              onError={handleImageError}
            />
          ))}
        </div>
        {/* Main Product Image */}
        <div className="productdisplay-img">
          <img
            className="productdisplay-main-img"
            src={
              product.image ||
              "http://localhost:4005/images/default-placeholder.png"
            }
            alt={product.name || "Product"}
            onError={handleImageError}
          />
        </div>
      </div>
      <div className="productdisplay-right">
        {/* Product Name */}
        <h1>{product.name || "Unnamed Product"}</h1>

        {/* Star Ratings */}
        <div className="productdisplay-right-stars">
          {[...Array(4)].map((_, index) => (
            <img key={index} src={start_icon} alt="Star" />
          ))}
          <img src={start_dull_icon} alt="Dull Star" />
          <p>(122)</p>
        </div>

        {/* Product Prices */}
        <div className="productdisplay-right-prices">
          <div className="productdisplay-right-price-old">
            ${product.old_price || 0}
          </div>
          <div className="productdisplay-right-price-new">
            ${product.new_price || 0}
          </div>
        </div>

        {/* Product Description */}
        <div className="productdisplay-right-description">
          {product.description || "No description available."}
        </div>

        {/* Product Sizes */}
        <div className="productdisplay-right-size">
          <h1>Select Size</h1>
          <div className="productdisplay-right-sizes">
            {["S", "M", "L", "XL", "XXL"].map((size, index) => (
              <div key={index}>{size}</div>
            ))}
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={() => {
            addToCart(product.id);
          }}
        >
          ADD TO CART
        </button>

        {/* Categories and Tags */}
        <p className="productdisplay-right-category">
          <span>Category:</span> {product.category || "Uncategorized"}
        </p>
        <p className="productdisplay-right-category">
          <span>Tags:</span> {product.tags?.join(", ") || "No tags available"}
        </p>
      </div>
    </div>
  );
};

export default ProductDisplay;
