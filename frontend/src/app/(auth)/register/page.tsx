"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Input from "@/src/components/ui/input";
import Button from "@/src/components/ui/button";
import GoogleIcon from "@/src/components/ui/google-icon";
import GithubIcon from "@/src/components/ui/github-icon";
import { validateEmail, validatePassword } from "@/src/lib/validation";


const Register = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({email: "", password: ""});

  const validate = (): boolean => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    setErrors({
      email: emailError || "",
      password: passwordError || ""
    });

    return !emailError && !passwordError;
  }

  function handleSubmit() {
    //TODO: wire up registration logic
    if (validate()) {
      router.push("/assessment");      
    }
  }

  function handleGoogle() {
    //TODO: wire up google auth
    router.push("/assessment");
  }

  function handleGithub() {
    //TODO: wire up github
    router.push("/assessment");
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="border border-bunker-grey p-16 w-full max-w-lg flex flex-col gap-8">

        <h1 className="text-center text-5xl text-white-smoke">Create an Account</h1>

        <div className="flex flex-col gap-3">
          <p className="text-center font-ibm-plex text-sm text-white-smoke">
            Sign up with:
          </p>
          <div className="flex gap-4">
            <Button variant="outline" icon={<GoogleIcon size={20}/>} onClick={handleGoogle} className="flex-1">
              Google
            </Button>
              <Button variant="outline" icon={<GithubIcon size={20}/>} onClick={handleGithub} className="flex-1">
              GitHub
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <hr className="flex-1 border-bunker-grey"/>
          <span className="font-jetbrains-mono text-xs tracking-widest uppercase text-white-smoke">
            or
          </span>
          <hr className="flex-1 border-bunker-grey"/>
        </div>

        <div className="flex flex-col gap-6">
          <Input
            label="Email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={setEmail}
            error={errors.email}
            onBlur={() => setErrors(prev => ({ ...prev, email: validateEmail(email) || "" }))}
          />
          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={setPassword}
            error={errors.password}
            onBlur={() => setErrors(prev => ({ ...prev, password: validatePassword(password) || "" }))}
          />
        </div>
 
        <Button variant="solid" onClick={handleSubmit} className="w-full">
          Sign Up
        </Button>
 
        <p className="text-center font-ibm-plex text-sm text-white-smoke">
          Already have an account?{" "}
          <Link href="/login" className="text-signal-red hover:underline">
            Sign In Now.
          </Link>
        </p>        
      </div>

    </main>
  )
}

export default Register