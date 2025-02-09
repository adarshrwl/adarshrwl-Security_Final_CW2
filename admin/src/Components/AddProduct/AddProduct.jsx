import React, { useState } from "react";
import "./AddProduct.css";
import upload_area from "../../assets/upload_area.svg";

const AddProduct = () => {
  const [image, setImage] = useState(null);
  const [productDetails, setProductDetails] = useState({
    name: "",
    old_price: "",
    new_price: "",
    category: "women",
    image: "",
  });

  // Handle image file selection
  const imageHandler = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
    }
  };

  // Handle input changes for product details
  const changeHandler = (e) => {
    setProductDetails({ ...productDetails, [e.target.name]: e.target.value });
  };

  const Add_Product = async () => {
    try {
      if (!image) {
        alert("Please upload an image.");
        return;
      }

      // Upload image to backend
      const formData = new FormData();
      formData.append("product", image);

      const imageUploadResponse = await fetch(
        "http://localhost:4005/api/files/upload", // Use the backend's full URL
        {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
          body: formData,
        }
      );

      const responseData = await imageUploadResponse.json();

      if (!imageUploadResponse.ok || !responseData.success) {
        console.error("Image Upload Failed:", responseData);
        alert("Image upload failed. Please try again.");
        return;
      }

      // Add product details
      const product = {
        ...productDetails,
        image: responseData.image_url, // URL from the uploaded image response
        new_price: parseFloat(productDetails.new_price) || 0,
        old_price: parseFloat(productDetails.old_price) || 0,
      };

      const addProductResponse = await fetch(
        "http://localhost:4005/api/products/addproduct", // Use the backend's full URL
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(product),
        }
      );

      const addProductData = await addProductResponse.json();

      if (addProductData.success) {
        alert("Product Added Successfully!");
        setProductDetails({
          name: "",
          old_price: "",
          new_price: "",
          category: "women",
          image: "",
        });
        setImage(null);
      } else {
        alert("Failed to add product. Please try again.");
        console.error("Add Product Failed:", addProductData);
      }
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="add-product">
      <div className="addproduct-itemfield">
        <p>Product Title</p>
        <input
          value={productDetails.name}
          onChange={changeHandler}
          type="text"
          name="name"
          placeholder="Type here"
        />
      </div>
      <div className="addproduct-price">
        <div className="addproduct-itemfield">
          <p>Price</p>
          <input
            value={productDetails.old_price}
            onChange={changeHandler}
            type="number"
            name="old_price"
            placeholder="Type here"
          />
        </div>
        <div className="addproduct-itemfield">
          <p>Offer Price</p>
          <input
            value={productDetails.new_price}
            onChange={changeHandler}
            type="number"
            name="new_price"
            placeholder="Type here"
          />
        </div>
      </div>
      <div className="addproduct-itemfield">
        <p>Product Category</p>
        <select
          value={productDetails.category}
          onChange={changeHandler}
          name="category"
          className="add-product-selector"
        >
          <option value="women">Women</option>
          <option value="men">Men</option>
          <option value="kid">Kid</option>
        </select>
      </div>
      <div className="addproduct-item-field">
        <label htmlFor="file-input">
          <img
            src={image ? URL.createObjectURL(image) : upload_area}
            className="addproduct-thumbnail-img"
            alt="Product Preview"
          />
        </label>
        <input
          onChange={imageHandler}
          type="file"
          name="image"
          id="file-input"
          hidden
        />
      </div>
      <button onClick={Add_Product} className="addproduct-btn">
        ADD
      </button>
    </div>
  );
};

export default AddProduct;
