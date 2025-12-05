
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default function SplashPage() {
  return (
    <div className="flex flex-col h-screen bg-primary text-primary-foreground text-center">
      <div className="flex-grow flex flex-col justify-center items-center p-8 space-y-8">
        <Image
          src="/bnm-logo.png"
          alt="B.N.M Cafe Logo"
          width={250}
          height={250}
          priority
        />
        <div className="space-y-4">
            <h1 className="text-4xl font-bold">B.N.M Cafe</h1>
            <p className="text-lg text-primary-foreground/80 max-w-md mx-auto">
                Delicious meals and refreshing drinks, right on campus. Skip the line and order ahead.
            </p>
        </div>
      </div>
      <div className="p-8">
        <Button variant="secondary" size="lg" className="w-full h-14 text-lg bg-card text-primary hover:bg-card/90" asChild>
          <Link href="/login">Get Started</Link>
        </Button>
      </div>
    </div>
  );
}
