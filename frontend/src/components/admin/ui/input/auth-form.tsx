"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/hero/ui/input";
import Button from "@/components/hero/ui/button";
import GoogleIcon from "@/components/hero/ui/google-icon";
// import GithubIcon from "@/components/hero/ui/github-icon";

import { validateEmail, validatePassword, validatePasswordMatch } from "@/lib/validation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

interface AuthFormProps {
  startMode?: "login" | "register";
}


export default function AuthForm({startMode = "login"}: AuthFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">(startMode);
  
  const [formData, setFormData] = useState({fullName: "", email: "", password: "", confirmPassword: ""});
  const [errors, setErrors] = useState({fullName: "", email: "", password: "", confirmPassword: ""});
  const [touched, setTouched] = useState({fullName: false, email: false, password: false, confirmPassword: false });

  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputBlur = (field: keyof typeof formData) => {
    setTouched(prev => ({...prev, [field]: true}))
    setErrors(prev => ({...prev, [field]: validateField(field, formData)}));
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
      const updatedForm = {...formData, [field]: value};
      setFormData(updatedForm);
      if(touched[field]) {
        setErrors(prev => ({...prev, [field]: validateField(field, updatedForm)}));
      }
  }

  const validate = (): boolean => {
    const fullNameError = mode === "register" && !formData.fullName.trim() ? "Full name is required" : "";
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    const confirmError = validatePasswordMatch(formData.password, formData.confirmPassword);
    setErrors({
      fullName: fullNameError,
      email: emailError || "",
      password: passwordError || "",
      confirmPassword: confirmError || ""
    });
    setTouched({fullName: true, email: true, password: true, confirmPassword: true });

    if(mode === "login") {
      return !emailError && !passwordError;
    }

    return !fullNameError && !emailError && !passwordError && !confirmError;
  }

  const validateField = (field: keyof typeof formData, currentForm: typeof formData) => {
    switch(field) {
      case "fullName": 
        return currentForm.fullName.trim() ? "" : "Full name is required";
     
      case "email": 
        return validateEmail(currentForm.email) || "";
      
      case "password": 
        return validatePassword(currentForm.password) || "";
      
      case "confirmPassword": 
        return validatePasswordMatch(currentForm.password, currentForm.confirmPassword) || "";
    }
  }

  function handleOnKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if(event.key === "Enter") {
      event.preventDefault();
      handleSubmit();
    }
  }

  async function handleSubmit() {
    setServerError("");
    if (!validate()) return;
    setLoading(true);

    const targetEndpoint = mode === "login" ? "/auth/login" : "/auth/register";

    try{
      const response = await fetch(`${API_BASE}${targetEndpoint}`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(
          mode === "login" ?
          {
            email: formData.email,
            password: formData.password
          } :
          {
            full_name: formData.fullName,
            email: formData.email,
            password: formData.password,
          }
        ),
      });

      const data = await response.json();
      if (!response.ok) {
        const detail = data.detail;
        if (Array.isArray(detail)) {
          setServerError(detail.map((e: { msg: string }) => e.msg).join(" "));
        } else {
          setServerError(detail ?? `${mode === "login" ? "Login" : "Registration"} failed. Please try again.`);
        }
        return;
      }

      localStorage.setItem("aegis_token", data.access_token);
      localStorage.setItem("aegis_role", data.role);
      router.push("/assessment");
    } catch {
      setServerError("Server unreachable.");
    } finally {
      setLoading(false);
    }

  }

  function handleGoogle() {
    window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"}/api/v1/auth/google/login`;
  }

  const togglePasswordIcon = (
    <button
      type="button"
      className="text-default-text opacity-50 hover:opacity-100 transition-opacity"
      onClick={() => setShowPassword(!showPassword)}
      aria-label={showPassword ? "Hide Password" : "Show Password"}
    >
      {showPassword ? (
        //eye off icon
        <svg xmlns="https://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/> <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/> <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/> <line x1="2" x2="22" y1="2" y2="22"/>
        </svg>
      ) : (
        //eye on icon
        <svg xmlns="https://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/> <circle cx="12" cy="12" r="3"/>
        </svg>
      )}
    </button>
  )

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="border border-default-border p-8 w-full max-w-lg flex flex-col">
        <div className="flex flex-col gap-3">
          <h1 className="text-center text-4xl text-default-text">
            {mode === "login" ? "Welcome Back" : "Create an Account"}
          </h1>
          <p className="text-center font-ibm-plex text-base text-default-text mb-8">
              {mode === "login" ? "Sign in with" : "Sign up with"}
          </p>
        </div>
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-3">
            <div className="flex gap-4">
              <Button variant="social" icon={<GoogleIcon size={20}/>} onClick={handleGoogle} className="flex-1">
                Google
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <hr className="flex-1 border-default-border"/>
            <span className="text-xs tracking-widest uppercase text-default-text">
              or
            </span>
            <hr className="flex-1 border-default-border"/>
          </div>
          <div className="flex flex-col gap-6">
            {mode === "register" && (
              <Input
                label="Full Name"
                type="text"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(value) => handleInputChange("fullName", value)}
                error={errors.fullName}
                onBlur={() => handleInputBlur("fullName")}
              />
            )}
            <Input
              label="Email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(value) => handleInputChange("email", value)}
              error={errors.email}
              onBlur={() => handleInputBlur("email")}
            />
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={formData.password}
              onChange={(value) => handleInputChange("password", value)}
              error={errors.password}
              onBlur={() => handleInputBlur("password")}
              rightIcon={togglePasswordIcon}
              />
              {mode === "register" && (
                <Input
                  label="Confirm Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={(value) => handleInputChange("confirmPassword", value)}
                  error={errors.confirmPassword}
                  onBlur={() => handleInputBlur("confirmPassword")}
                  onKeyDown={handleOnKeyDown}
                  rightIcon={togglePasswordIcon}
                />
              )}
          </div>  

        </div>
        {serverError && (
          <p className="text-center font-ibm-plex text-sm text-system-red">
            {serverError}
          </p>
        )}

        <Button 
          variant="solid" 
          onClick={handleSubmit} 
          disabled={loading}
          className="w-full mt-8"
        >
          {loading ?
            (mode === "login" ? "Siging in..." : "Creating account...") :
            (mode === "login" ? "Sign In" : "Sign Up")
          }
        </Button>
 
        <p className="text-center font-ibm-plex text-sm text-default-text mt-4">
          {mode === "login" ? "Don'y have an account? " : "Already have and account? "}
          <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setServerError("");
                setErrors({fullName: "", email: "", password: "", confirmPassword: ""});
                setTouched({fullName: false, email: false, password: false, confirmPassword: false});
              }} 
              className="text-system-red hover:underline font-semibold bg-transparent border-none cursor-pointer p-0"
          >
            {mode === "login" ? "Sign Up Now." : "Sign In Now"}
          </button>
        </p>        
      </div>

    </main>
  )
}