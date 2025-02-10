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
    .matches(
      /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^a-zA-Z0-9])/,
      "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character."
    )
    .required("Password is required"),
});

const LoginSignup = () => {
  const [state, setState] = useState("Login");
  const [loading, setLoading] = useState(false);

  // ✅ Use React Hook Form for state management
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { state },
  });

  // ✅ Handle Form Submission
  const onSubmit = async (data) => {
    setLoading(true);
    if (state === "Login") {
      await handleAuthRequest(data, "login");
    } else {
      await handleAuthRequest(data, "signup");
    }
    setLoading(false);
  };

  // ✅ Login/Signup Request Handler
  const handleAuthRequest = async (data, action) => {
    const url =
      action === "login"
        ? "http://localhost:4005/api/auth/login"
        : "http://localhost:4005/api/auth/signup";

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include", // Required for cookies (refresh token)
      });

      const responseData = await response.json();

      if (response.ok) {
        const { accessToken } = responseData;
        localStorage.setItem("auth-token", accessToken); // Store token in memory/localStorage
        toast.success(`${action === "login" ? "Login" : "Signup"} Successful!`);
        setTimeout(() => window.location.replace("/"), 1500);
      } else {
        // Handle errors
        if (responseData.errors) {
          const errorMessages = responseData.errors
            .map((err) => err.msg)
            .join("\n");
          toast.error(errorMessages);
        } else {
          toast.error(responseData.message || `${action} failed`);
        }
      }
    } catch (error) {
      console.error(`${action} Error:`, error);
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="loginsignup">
      <div className="loginsignup-container">
        <h1>{state}</h1>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="loginsignup-fields">
            {/* Username Field (Only for Sign Up) */}
            {state === "Sign Up" && (
              <div>
                <input
                  type="text"
                  name="username"
                  {...register("username")}
                  placeholder="Your Name"
                />
                <p className="error-message">{errors.username?.message}</p>
              </div>
            )}

            {/* Email Field */}
            <div>
              <input
                type="email"
                name="email"
                {...register("email")}
                placeholder="Email Address"
              />
              <p className="error-message">{errors.email?.message}</p>
            </div>

            {/* Password Field */}
            <div>
              <input
                type="password"
                name="password"
                {...register("password")}
                placeholder="Password"
              />
              <p className="error-message">{errors.password?.message}</p>
            </div>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Processing..." : "Continue"}
          </button>
        </form>

        {/* Switch Between Login and Signup */}
        <p className="loginsignup-login">
          {state === "Sign Up" ? (
            <>
              Already have an account?{" "}
              <span onClick={() => setState("Login")}>Login here</span>
            </>
          ) : (
            <>
              Create an account?{" "}
              <span onClick={() => setState("Sign Up")}>Click here</span>
            </>
          )}
        </p>

        {/* Terms and Conditions */}
        {state === "Sign Up" && (
          <div className="loginsignup-agree">
            <input type="checkbox" required />
            <p>By continuing, I agree to the terms of use & privacy policy.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginSignup;
