import Link from "next/link";
import Image from "next/image";
import { Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="flex flex-col flex-grow items-center justify-center min-h-dvh bg-background px-6 text-center">
            <Image
                src="/bnmlogoB12.png"
                alt="B.N.M Cafe Logo"
                width={140}
                height={40}
                className="mb-10 dark:brightness-0 dark:invert"
            />
            <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-6">
                <Coffee className="h-8 w-8" />
            </div>
            <p className="text-sm font-bold tracking-widest text-muted-foreground uppercase mb-2">
                Error 404
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground mb-2">
                This page isn&apos;t on the menu
            </h1>
            <p className="text-muted-foreground max-w-xs mb-8">
                The page you&apos;re looking for doesn&apos;t exist or may have moved.
            </p>
            <Button asChild className="h-12 px-8 rounded-xl font-bold">
                <Link href="/menu">Back to Menu</Link>
            </Button>
        </div>
    );
}
