import React, { useEffect, useState } from "react";
import "./Popular.css";
import Item from "../Item/Item";

const Popular = () => {
  const [popularProducts, setPopularProducts] = useState([]);

  useEffect(() => {
    fetch("http://localhost:4005/popularinwomen")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log("API Response:", data); // ✅ Debugging Log
        if (Array.isArray(data)) {
          setPopularProducts(data); // ✅ Only update state if data is an array
        } else {
          console.error("Invalid API response format:", data);
          setPopularProducts([]); // ✅ Prevent errors by setting an empty array
        }
      })
      .catch((error) => {
        console.error("Error fetching popular products:", error);
        setPopularProducts([]); // ✅ Prevent frontend crash
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
          <p>Loading popular products...</p> // ✅ Prevents crash if data is not available
        )}
      </div>
    </div>
  );
};

export default Popular;
