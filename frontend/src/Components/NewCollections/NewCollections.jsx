import React, { useEffect, useState } from "react";
import "./NewCollections.css";
import Item from "../Item/Item";

const NewCollections = () => {
  const [new_collection, setNew_collection] = useState([]);

  useEffect(() => {
    // Update the fetch URL to match the backend route
    fetch("http://localhost:4005/api/products/newcollections")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        // Ensure the API response is valid before updating the state
        if (Array.isArray(data)) {
          setNew_collection(data);
        } else {
          console.error("Invalid API response format:", data);
          setNew_collection([]);
        }
      })
      .catch((error) => {
        console.error("Error fetching new collections:", error);
        setNew_collection([]); // Prevent frontend crash
      });
  }, []);

  return (
    <div className="new-collections">
      <h1>NEW COLLECTIONS</h1>
      <hr />
      <div className="collections">
        {Array.isArray(new_collection) && new_collection.length > 0 ? (
          new_collection.map((item, i) => (
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
          <p>Loading new collections...</p>
        )}
      </div>
    </div>
  );
};

export default NewCollections;
