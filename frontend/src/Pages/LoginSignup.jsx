import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./CSS/LoginSignup.css";

// ✅ Validation Schema
const schema = yup.object().shape({
  username: yup.string().when("state", {
    is: "Sign Up",
    then: yup.string().required("Username is required"),
  }),
  email: yup
    .string()
    .email("Invalid email format")
    .required("Email is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
});

const LoginSignup = () => {
  const [state, setState] = useState("Login");

  // ✅ Use React Hook Form for state management
  const {
    register,
    handleSubmit,
    setValue, // Allows manual updates
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  // ✅ Handle input changes correctly
  const changeHandler = (e) => {
    setValue(e.target.name, e.target.value);
  };

  const login = async (data) => {
    // console.log("Login Function Executed", data);
    try {
      const response = await fetch("http://localhost:4005/login", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const responseData = await response.json();

      if (response.ok) {
        localStorage.setItem("auth-token", responseData.token);
        toast.success("Login Successful!");
        setTimeout(() => window.location.replace("/"), 1500);
      } else {
        toast.error(
          responseData.message || responseData.errors || "Login failed"
        );
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    }
  };

  const signup = async (data) => {
    // console.log("Signup Function Executed", data);
    try {
      const response = await fetch("http://localhost:4005/signup", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const responseData = await response.json();

      if (response.ok) {
        localStorage.setItem("auth-token", responseData.token);
        toast.success("Signup Successful!");
        setTimeout(() => window.location.replace("/"), 1500);
      } else {
        toast.error(
          responseData.message || responseData.errors || "Signup failed"
        );
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="loginsignup">
      <div className="loginsignup-container">
        <h1>{state}</h1>
        <form onSubmit={handleSubmit(state === "Login" ? login : signup)}>
          <div className="loginsignup-fields">
            {state === "Sign Up" && (
              <>
                <input
                  type="text"
                  name="username"
                  {...register("username")}
                  onChange={changeHandler}
                  placeholder="Your Name"
                />
                <p className="error-message">{errors.username?.message}</p>
              </>
            )}
            <input
              type="email"
              name="email"
              {...register("email")}
              onChange={changeHandler}
              placeholder="Email Address"
            />
            <p className="error-message">{errors.email?.message}</p>
            <input
              type="password"
              name="password"
              {...register("password")}
              onChange={changeHandler}
              placeholder="Password"
            />
            <p className="error-message">{errors.password?.message}</p>
          </div>
          <button type="submit">Continue</button>
        </form>
        {state === "Sign Up" ? (
          <p className="loginsignup-login">
            Already have an account?{" "}
            <span onClick={() => setState("Login")}>Login here</span>
          </p>
        ) : (
          <p className="loginsignup-login">
            Create an account?{" "}
            <span onClick={() => setState("Sign Up")}>Click here</span>
          </p>
        )}
        <div className="loginsignup-agree">
          <input type="checkbox" />
          <p>By continuing, I agree to the terms of use & privacy policy.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginSignup;
