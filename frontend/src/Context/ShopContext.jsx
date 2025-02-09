import React, { createContext, useEffect, useState } from "react";

export const ShopContext = createContext(null);

const getDefaultCart = () => {
  let cart = {};
  for (let index = 0; index < 300 + 1; index++) {
    cart[index] = 0;
  }
  return cart;
};

const ShopContextProvider = (props) => {
  const [all_product, setAll_Product] = useState([]);
  const [cartItems, setCartItems] = useState(getDefaultCart());

  useEffect(() => {
    // Fetch all products
    fetch("http://localhost:4005/api/products/allproducts")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch products");
        return res.json();
      })
      .then((data) => setAll_Product(data))
      .catch((err) => console.error("Fetch error (allproducts):", err));

    // Fetch cart items if user is logged in
    if (localStorage.getItem("auth-token")) {
      fetch("http://localhost:4005/api/cart/getcart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${localStorage.getItem("auth-token")}`,
        },
        body: JSON.stringify({}), // Empty request body
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch cart items");
          return res.json();
        })
        .then((data) => setCartItems(data))
        .catch((err) => console.error("Fetch error (getcart):", err));
    }
  }, []);

  const addToCart = (itemId) => {
    setCartItems((prev) => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));

    if (localStorage.getItem("auth-token")) {
      fetch("http://localhost:4005/api/cart/addtocart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${localStorage.getItem("auth-token")}`,
        },
        body: JSON.stringify({ itemId }), // Include itemId in the body
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to add to cart");
          return res.json();
        })
        .then((data) => console.log("Added to cart:", data))
        .catch((err) => console.error("Fetch error (addtocart):", err));
    }
  };

  const removeFromCart = (itemId) => {
    setCartItems((prev) => ({
      ...prev,
      [itemId]: Math.max(prev[itemId] - 1, 0),
    }));

    if (localStorage.getItem("auth-token")) {
      fetch("http://localhost:4005/api/cart/removefromcart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${localStorage.getItem("auth-token")}`,
        },
        body: JSON.stringify({ itemId }),
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to remove from cart");
          return res.json();
        })
        .then((data) => console.log("Removed from cart:", data))
        .catch((err) => console.error("Fetch error (removefromcart):", err));
    }
  };

  const getTotalCartAmount = () => {
    let totalAmount = 0;
    for (const item in cartItems) {
      if (cartItems[item] > 0) {
        let itemInfo = all_product.find(
          (product) => product.id === Number(item)
        );
        if (itemInfo) {
          totalAmount += itemInfo.new_price * cartItems[item];
        }
      }
    }
    return totalAmount;
  };

  const getTotalCartItems = () => {
    return Object.values(cartItems).reduce((acc, count) => acc + count, 0);
  };

  const contextValue = {
    all_product,
    cartItems,
    addToCart,
    removeFromCart,
    getTotalCartAmount,
    getTotalCartItems,
  };

  return (
    <ShopContext.Provider value={contextValue}>
      {props.children}
    </ShopContext.Provider>
  );
};

export default ShopContextProvider;
