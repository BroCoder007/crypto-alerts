"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { clsx } from "clsx";
import { User, Lock, Mail } from "lucide-react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [isLogin, setIsLogin] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    // --- COIN LOGIC ---
    const handleDragEnd = (event: any, info: any) => {
        // If dragged up significantly
        if (info.offset.y < -100) {
            setIsUnlocked(true);
        }
    };

    return (
        <main className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden" ref={containerRef}>
            {/* Background Ambient Glows */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-fuchsia-500/10 rounded-full blur-[100px]" />
            </div>

            <AnimatePresence mode="wait">
                {!isUnlocked ? (
                    /* --- LOCKED STATE (Coin & Slot) --- */
                    <motion.div
                        key="lock-screen"
                        exit={{ opacity: 0, scale: 1.5, filter: "blur(20px)" }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        className="flex flex-col items-center justify-center gap-12 z-20"
                    >
                        {/* INSTRUCTION */}
                        <motion.h2
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="text-2xl font-bold text-indigo-200 tracking-widest uppercase"
                        >
                            Insert Coin to Start
                        </motion.h2>

                        {/* THE SLOT */}
                        <div className="relative w-64 h-12 bg-slate-900/50 rounded-full border-4 border-indigo-500/30 shadow-[0_0_50px_rgba(99,102,241,0.3)] flex items-center justify-center backdrop-blur-md">
                            <div className="w-[90%] h-3 bg-black/50 rounded-full shadow-inner" />

                            {/* Glow Effect */}
                            <motion.div
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl"
                            />
                        </div>

                        {/* THE COIN */}
                        <motion.div
                            drag
                            dragConstraints={containerRef}
                            dragSnapToOrigin={true}
                            onDragEnd={handleDragEnd}
                            whileHover={{ scale: 1.1, cursor: "grab" }}
                            whileDrag={{ scale: 1.2, cursor: "grabbing" }}
                            className="relative group"
                        >
                            {/* Coin Visual */}
                            <div className="w-24 h-24 rounded-full bg-gradient-to-b from-amber-300 to-amber-600 border-4 border-amber-200 shadow-[0_10px_30px_rgba(245,158,11,0.5)] flex items-center justify-center relative z-10">
                                <span className="text-5xl font-bold text-amber-900 drop-shadow-sm">₿</span>

                                {/* Inner Ring */}
                                <div className="absolute inset-1 rounded-full border-2 border-amber-400/50 border-dashed opacity-50" />
                            </div>

                            {/* Pulse Ring */}
                            <motion.div
                                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="absolute inset-0 bg-amber-400/30 rounded-full -z-10"
                            />
                            <p className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-amber-200/50 text-sm whitespace-nowrap pointer-events-none">
                                Drag Up
                            </p>
                        </motion.div>

                    </motion.div>
                ) : (
                    /* --- UNLOCKED STATE (Login Form) --- */
                    <motion.div
                        key="login-form"
                        initial={{ opacity: 0, scale: 0.8, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ type: "spring", duration: 0.8, delay: 0.2 }}
                        className="w-full max-w-[900px] z-20"
                    >
                        <GlassCard className="w-full h-[600px] p-0 relative overflow-hidden flex shadow-2xl border-slate-700/50">

                            {/* LEFT SIDE (Sign In Form) */}
                            <div className="w-1/2 h-full flex flex-col justify-center items-center p-12 relative z-10 transition-all duration-500">
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="w-full max-w-sm"
                                >
                                    <h2 className="text-3xl font-bold text-white mb-6">Sign In</h2>
                                    <div className="flex gap-4 mb-6">
                                        <button
                                            onClick={() => signIn("google")}
                                            className="flex-1 py-2 border border-slate-700 rounded-lg text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
                                        >
                                            Google
                                        </button>
                                        <button
                                            onClick={() => signIn("github")}
                                            className="flex-1 py-2 border border-slate-700 rounded-lg text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
                                        >
                                            Github
                                        </button>
                                    </div>
                                    <p className="text-center text-slate-500 text-sm mb-6">or use your email account</p>

                                    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 text-slate-500 w-5 h-5" />
                                            <input type="email" placeholder="Email" className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-2.5 pl-10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 text-slate-500 w-5 h-5" />
                                            <input type="password" placeholder="Password" className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-2.5 pl-10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                                        </div>
                                        <a href="#" className="text-xs text-slate-400 hover:text-white block text-center pt-2">Forgot your password?</a>
                                        <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-indigo-500/20 transition-all mt-4">
                                            SIGN IN
                                        </button>
                                    </form>
                                </motion.div>
                            </div>

                            {/* RIGHT SIDE (Sign Up Form) */}
                            <div className="w-1/2 h-full flex flex-col justify-center items-center p-12 relative z-10 transition-all duration-500">
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="w-full max-w-sm"
                                >
                                    <h2 className="text-3xl font-bold text-white mb-6 text-center">Create Account</h2>
                                    <div className="flex gap-4 mb-6">
                                        <button
                                            onClick={() => signIn("google")}
                                            className="flex-1 py-2 border border-slate-700 rounded-lg text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
                                        >
                                            Google
                                        </button>
                                        <button
                                            onClick={() => signIn("github")}
                                            className="flex-1 py-2 border border-slate-700 rounded-lg text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
                                        >
                                            Github
                                        </button>
                                    </div>
                                    <p className="text-center text-slate-500 text-sm mb-6">or use your email for registration</p>

                                    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 text-slate-500 w-5 h-5" />
                                            <input type="text" placeholder="Name" className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-2.5 pl-10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all" />
                                        </div>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 text-slate-500 w-5 h-5" />
                                            <input type="email" placeholder="Email" className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-2.5 pl-10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all" />
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 text-slate-500 w-5 h-5" />
                                            <input type="password" placeholder="Password" className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-2.5 pl-10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all" />
                                        </div>
                                        <button className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-fuchsia-500/20 transition-all mt-4">
                                            SIGN UP
                                        </button>
                                    </form>
                                </motion.div>
                            </div>

                            {/* OVERLAY PANEL (The Sliding "Curtain") */}
                            <motion.div
                                initial={false}
                                animate={{ x: isLogin ? "100%" : "0%" }}
                                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                                className="absolute top-0 left-0 w-1/2 h-full z-20 overflow-hidden"
                            >
                                <div className="w-[200%] h-full relative" style={{ left: "-100%" }}>
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-fuchsia-600 flex items-center justify-center text-white">

                                        {/* Sliding Content Container */}
                                        <div className="w-full h-full flex">

                                            {/* Left Panel Content */}
                                            <div className="w-1/2 h-full flex flex-col items-center justify-center p-12 text-center"
                                                style={{ opacity: !isLogin ? 1 : 0, transition: 'opacity 0.3s delay 0.2s' }}
                                            >
                                                <h2 className="text-3xl font-bold mb-4">Welcome Back!</h2>
                                                <p className="mb-8 text-indigo-100">To keep connected with us please login with your personal info</p>
                                                <button
                                                    onClick={() => setIsLogin(true)}
                                                    className="px-10 py-3 border border-white rounded-full font-semibold hover:bg-white hover:text-indigo-600 transition-all"
                                                >
                                                    SIGN IN
                                                </button>
                                            </div>

                                            {/* Right Panel Content */}
                                            <div className="w-1/2 h-full flex flex-col items-center justify-center p-12 text-center"
                                                style={{ opacity: isLogin ? 1 : 0, transition: 'opacity 0.3s delay 0.2s' }}
                                            >
                                                <h2 className="text-3xl font-bold mb-4">Hello, Friend!</h2>
                                                <p className="mb-8 text-indigo-100">Enter your personal details and start your journey with us</p>
                                                <button
                                                    onClick={() => setIsLogin(false)}
                                                    className="px-10 py-3 border border-white rounded-full font-semibold hover:bg-white hover:text-indigo-600 transition-all"
                                                >
                                                    SIGN UP
                                                </button>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
