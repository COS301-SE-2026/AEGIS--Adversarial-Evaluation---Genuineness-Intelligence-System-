import Image from "next/image";
import Button from "../components/ui/button";

export default function Home() {
  return (
    <div>
      <main>
        <h1 className="text-signal-red">Welcome to AEGIS</h1>
        <Button>TEST</Button>
        <Button variant="outline">OUTLNED BUTTON</Button>
      </main>
    </div>
  );
}
