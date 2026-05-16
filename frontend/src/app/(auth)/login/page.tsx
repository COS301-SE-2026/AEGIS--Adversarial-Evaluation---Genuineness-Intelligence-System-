"use client"
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Input from "@/components/hero/ui/input";
import Button from "@/components/hero/ui/button";
import GoogleIcon from "@/components/hero/ui/google-icon";
import GithubIcon from "@/components/hero/ui/github-icon";


const Login = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit() {
    //TODO: wire up registration logic
    router.push("/assessment");
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
      <div className="border border-default-border p-16 w-full max-w-lg flex flex-col gap-8">

        <h1 className="text-center text-5xl text-default-text">Welcome Back</h1>

        <div className="flex flex-col gap-3">
          <p className="text-center font-ibm-plex text-sm text-default-text">
            Sign in with:
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
          <hr className="flex-1 border-default-border"/>
          <span className="font-jetbrains-mono text-xs tracking-widest uppercase text-default-text">
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
            onChange={setEmail}
          />
          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={setPassword}
          />
        </div>
 
        <Button variant="solid" onClick={handleSubmit} className="w-full">
          Sign In
        </Button>
 
        <p className="text-center font-ibm-plex text-sm text-default-text">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-system-red hover:underline">
            Sign Up Now.
          </Link>
        </p>        
      </div>

    </main>
  )
}

export default Login