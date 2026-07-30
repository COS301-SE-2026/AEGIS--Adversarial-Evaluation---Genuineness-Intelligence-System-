"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/hero/ui/input";
import Button from "@/components/hero/ui/button";
import GoogleIcon from "@/components/hero/ui/google-icon";
import { apiPost, ApiError, API_BASE_URL } from "@/lib/apiClient";
// import GithubIcon from "@/components/hero/ui/github-icon";

import { validateEmail, validatePassword, validatePasswordMatch } from "@/lib/validation";


interface AuthFormProps {
  startMode?: "login" | "register";
}

function handleGoogle() {
  window.location.href = `${API_BASE_URL}/api/v1/auth/google/login`;
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
      setErrors(prev => ({...prev, email: emailError || "", password: passwordError || ""}));
      setTouched(prev => ({...prev, email: true, password: true}));
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
      const data = await apiPost<
        {
          access_token: string; 
          role: string;   
        },
        {
          email: string;
          password: string;
          full_name?: string;
        }
      >(
        mode === "login" ?
          "/api/v1/auth/login" :
          "/api/v1/auth/register",

        mode === "login" ?
          {
            email: formData.email,
            password: formData.password,
          } :
          {
            full_name: formData.fullName,
            email: formData.email,
            password: formData.password,
          }
      );

      localStorage.setItem("aegis_token", data.access_token);
      localStorage.setItem("aegis_role", data.role);
      
      if(data.role === "RECRUITER") {
        router.push("/assessments");
      }
      else if(data.role === "CANDIDATE") {
        router.push("/assessment");
      }
      else {
        router.push("/auth/login");
      }
    } catch (error) {
      if (error instanceof ApiError) {
        const detail = (error.data as {detail?: unknown})?.detail;

        if (Array.isArray(detail)) {
          setServerError(detail.map((e: { message: string }) => e.message).join(" "));
        }
      }
      else {
        setServerError("Server unreachable.");
      }
    } finally {
      setLoading(false);
    }

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

  let submitButtonText: string;

  if (loading) {
    submitButtonText = mode === "login" ? "Signing in..." : "Creating account...";
  }
  else {
    submitButtonText = mode === "login" ? "Sign In" : "Sign Up";
  }

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
          {submitButtonText}
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