
'use client';

import { useSupabase } from '@/lib/supabase/provider';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
    LogOut,
    Mail,
    MessageSquare,
    FileText,
    ShieldCheck,
    ArrowLeft,
    ChevronRight,
    Moon,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring' as const, stiffness: 300, damping: 26 },
    },
};

function ProfileSkeleton() {
    return (
        <div className="min-h-screen bg-background">
            <div className="px-4 py-4 sm:px-6">
                <div className="max-w-md mx-auto flex items-center justify-center relative">
                    <Skeleton className="h-9 w-9 rounded-full absolute left-0" />
                    <Skeleton className="h-7 w-32" />
                </div>
            </div>
            <div className="max-w-md mx-auto px-4 sm:px-6">
                <div className="flex flex-col items-center pt-6 pb-8">
                    <Skeleton className="h-28 w-28 rounded-full mb-4" />
                    <Skeleton className="h-7 w-40 mb-2" />
                    <Skeleton className="h-4 w-48" />
                </div>
                <div className="space-y-6">
                    <Skeleton className="h-[72px] w-full rounded-2xl" />
                    <Skeleton className="h-[72px] w-full rounded-2xl" />
                    <Skeleton className="h-[120px] w-full rounded-2xl" />
                    <Skeleton className="h-14 w-full rounded-2xl" />
                </div>
            </div>
        </div>
    );
}

export default function ProfilePage() {
    const { user, userProfile, supabase, isUserLoading } = useSupabase();
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    // useTheme() is undefined until hydration completes; render the switch
    // neutral until then to avoid a hydration mismatch.
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isUserLoading && (!user || user.is_anonymous)) {
            router.replace('/');
        }
    }, [isUserLoading, user, router]);

    const handleLogout = async () => {
        if (supabase) {
            await supabase.auth.signOut();
        }
        router.push('/');
    };

    if (isUserLoading || !user || !userProfile) {
        return <ProfileSkeleton />;
    }

    const getInitials = (name: string) =>
        name
            ? name
                  .trim()
                  .split(/\s+/)
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()
            : 'U';

    return (
        <div className="min-h-screen bg-background pb-12">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md px-4 py-4 sm:px-6">
                <div className="max-w-md mx-auto flex items-center justify-center relative">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push('/menu')}
                        className="absolute left-0 rounded-full hover:bg-foreground/5"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-2xl font-extrabold tracking-tight text-foreground">My Profile</h1>
                </div>
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="max-w-md mx-auto px-4 sm:px-6"
            >
                {/* Hero */}
                <motion.div variants={itemVariants} className="flex flex-col items-center text-center pt-6 pb-8">
                    <div className="h-28 w-28 rounded-full bg-gradient-to-br from-[#1d6332] to-[#154b23] flex items-center justify-center text-white text-4xl font-bold shadow-lg shadow-[#154b23]/20 ring-4 ring-background mb-4">
                        {getInitials(userProfile.name)}
                    </div>
                    <h2 className="text-2xl font-extrabold tracking-tight text-foreground">{userProfile.name}</h2>
                    <p className="text-muted-foreground text-sm mt-0.5">{userProfile.email}</p>
                </motion.div>

                {/* Account */}
                <motion.div variants={itemVariants} className="mb-6">
                    <p className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wider px-1 mb-2">
                        Account
                    </p>
                    <div className="bg-card rounded-2xl shadow-[0_2px_8px_rgb(0,0,0,0.04)] border overflow-hidden">
                        <div className="flex items-center gap-4 p-4">
                            <span className="h-10 w-10 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                <Mail className="h-5 w-5" />
                            </span>
                            <div className="min-w-0">
                                <p className="text-xs text-muted-foreground">Email</p>
                                <p className="font-semibold text-foreground truncate">{userProfile.email}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Appearance */}
                <motion.div variants={itemVariants} className="mb-6">
                    <p className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wider px-1 mb-2">
                        Appearance
                    </p>
                    <div className="bg-card rounded-2xl shadow-[0_2px_8px_rgb(0,0,0,0.04)] border overflow-hidden">
                        <div className="flex items-center gap-4 p-4">
                            <span className="h-10 w-10 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                <Moon className="h-5 w-5" />
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-foreground">Dark Mode</p>
                                <p className="text-sm text-muted-foreground">Easier on the eyes at night</p>
                            </div>
                            <Switch
                                checked={mounted && theme === 'dark'}
                                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                                disabled={!mounted}
                                aria-label="Toggle dark mode"
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Activity */}
                <motion.div variants={itemVariants} className="mb-6">
                    <p className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wider px-1 mb-2">
                        Activity
                    </p>
                    <div className="bg-card rounded-2xl shadow-[0_2px_8px_rgb(0,0,0,0.04)] border overflow-hidden">
                        <button
                            type="button"
                            onClick={() => router.push('/profile/feedback')}
                            className="w-full flex items-center gap-4 p-4 text-left transition-colors hover:bg-foreground/[0.03] active:bg-foreground/[0.06]"
                        >
                            <span className="h-10 w-10 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                <MessageSquare className="h-5 w-5" />
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-foreground">My Feedback</p>
                                <p className="text-sm text-muted-foreground">View and add your feedback</p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground/40" />
                        </button>
                    </div>
                </motion.div>

                {/* Legal */}
                <motion.div variants={itemVariants} className="mb-8">
                    <p className="text-xs font-bold text-muted-foreground/70 uppercase tracking-wider px-1 mb-2">
                        Legal
                    </p>
                    <div className="bg-card rounded-2xl shadow-[0_2px_8px_rgb(0,0,0,0.04)] border divide-y divide-border overflow-hidden">
                        <button
                            type="button"
                            onClick={() => router.push('/terms')}
                            className="w-full flex items-center gap-4 p-4 text-left transition-colors hover:bg-foreground/[0.03] active:bg-foreground/[0.06]"
                        >
                            <span className="h-10 w-10 shrink-0 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                                <FileText className="h-5 w-5" />
                            </span>
                            <span className="flex-1 font-medium text-foreground">Terms and Conditions</span>
                            <ChevronRight className="h-5 w-5 text-muted-foreground/40" />
                        </button>
                        <button
                            type="button"
                            onClick={() => router.push('/privacy')}
                            className="w-full flex items-center gap-4 p-4 text-left transition-colors hover:bg-foreground/[0.03] active:bg-foreground/[0.06]"
                        >
                            <span className="h-10 w-10 shrink-0 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                                <ShieldCheck className="h-5 w-5" />
                            </span>
                            <span className="flex-1 font-medium text-foreground">Privacy Policy</span>
                            <ChevronRight className="h-5 w-5 text-muted-foreground/40" />
                        </button>
                    </div>
                </motion.div>

                {/* Logout */}
                <motion.div variants={itemVariants}>
                    <Button
                        onClick={handleLogout}
                        variant="ghost"
                        className="w-full h-14 rounded-2xl bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive font-bold text-base transition-all active:scale-[0.98]"
                    >
                        <LogOut className="mr-2 h-5 w-5" />
                        Logout
                    </Button>
                </motion.div>
            </motion.div>
        </div>
    );
}
