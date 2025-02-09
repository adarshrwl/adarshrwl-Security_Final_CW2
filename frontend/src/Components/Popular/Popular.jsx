import React, { useEffect, useState } from "react";
import "./Popular.css";
import Item from "../Item/Item";

const Popular = () => {
  const [popularProducts, setPopularProducts] = useState([]);

  useEffect(() => {
    // Update the fetch URL to match the backend route
    fetch("http://localhost:4005/api/products/popularinwomen")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        // Ensure the API response is valid before updating the state
        if (Array.isArray(data)) {
          setPopularProducts(data);
        } else {
          console.error("Invalid API response format:", data);
          setPopularProducts([]);
        }
      })
      .catch((error) => {
        console.error("Error fetching popular products:", error);
        setPopularProducts([]); // Prevent frontend crash
      });
  }, []);

  return (
    <div className="popular">
      <h1>POPULAR IN WOMEN</h1>
      <hr />
      <div className="popular-item">
        {Array.isArray(popularProducts) && popularProducts.length > 0 ? (
          popularProducts.map((item, i) => (
            <Item
              key={i}
              id={item.id}
              name={item.name}
              image={item.image}
              new_price={item.new_price}
              old_price={item.old_price}
            />
          ))
        ) : (
          <p>Loading popular products...</p>
        )}
      </div>
    </div>
  );
};

export default Popular;
