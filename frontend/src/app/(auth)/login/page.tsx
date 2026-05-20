"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Input from "@/components/hero/ui/input";
import Button from "@/components/hero/ui/button";
import GoogleIcon from "@/components/hero/ui/google-icon";
import GithubIcon from "@/components/hero/ui/github-icon";
import { validateEmail, validatePassword } from "@/lib/validation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

const Login = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({email: "", password: ""});
  const [touched, setTouched] = useState({ email: false, password: false });
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleEmailChange(value: string) {
    setEmail(value);
    if (touched.email) {
      setErrors(prev => ({ ...prev, email: validateEmail(value) || ""}));
    }
  }

  function handlePasswordChange(value: string) {
    setPassword(value);
    if (touched.password) {
      setErrors(prev => ({ ...prev, password: validatePassword(value) || ""}));
    }
  }

  function handleEmailBlur() {
    setTouched(prev => ({ ...prev, email: true }));
    setErrors(prev => ({ ...prev, email: validateEmail(email) || "" }));
  }

  function handlePasswordBlur() {
    setTouched(prev => ({ ...prev, password: true }));
    setErrors(prev => ({ ...prev, password: validatePassword(password) || "" }));
  }

  const validate = (): boolean => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    setErrors({
      email: emailError || "",
      password: passwordError || ""
    });
    setTouched({ email: true, password: true });

    return !emailError && !passwordError;
  }

  async function handleSubmit() {
    setServerError("");
    if (!validate()) return;
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        const detail = data.detail;
        if (Array.isArray(detail)) {
          setServerError(detail.map((e: { msg: string }) => e.msg).join(" "));
        } else {
          setServerError(detail ?? "Login failed. Please try again.");
        }
        return;
      }

      localStorage.setItem("access_token", data.access_token);
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

  function handleGithub() {
    //TODO: wire up github
    router.push("/assessment");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="border border-default-border p-8 w-full max-w-lg flex flex-col">
        <div className="flex flex-col gap-3">
          <h1 className="text-center text-4xl text-default-text">Welcome Back</h1>
          <p className="text-center font-ibm-plex text-base text-default-text mb-8">
              Sign in with:
          </p>
        </div>
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-3">
            <div className="flex gap-4">
              <Button variant="social" icon={<GoogleIcon size={20}/>} onClick={handleGoogle} className="flex-1">
                Google
              </Button>
                <Button variant="social" icon={<GithubIcon size={20}/>} onClick={handleGithub} className="flex-1">
                GitHub
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
            <Input
              label="Email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={handleEmailChange}
              error={errors.email}
              onBlur={handleEmailBlur}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={handlePasswordChange}
              error={errors.password}
              onBlur={handlePasswordBlur}
            />
          </div>
          {serverError && (
            <p className="text-center font-ibm-plex text-sm text-system-red">
              {serverError}
            </p>
          )}
          <Button variant="solid" onClick={handleSubmit} className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
          <p className="text-center font-ibm-plex text-sm text-default-text">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-system-red hover:underline">
              Sign Up Now.
            </Link>
          </p>        
        </div>
      </div>

    </main>
  )
}

export default Login