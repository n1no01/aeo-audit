import Link from "next/link";

interface NavbarProps {
  userId: string | null;
}

export default function Navbar({ userId }: NavbarProps) {
  return (
    <nav className="w-full max-w-5xl mx-auto p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-transparent z-10">
      <Link href={userId ? "/dashboard" : "/"} className="group cursor-pointer select-none">
        <div className="text-2xl font-black tracking-tight italic">
          AEO<span className="text-blue-600 group-hover:text-blue-500 transition-colors duration-200">Audit</span> Pro
        </div>
      </Link>
      
      {/* Nav Links */}
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
        <Link href="/how-it-works" className="text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 transition">
          How It Works
        </Link>
        <Link href="/pricing" className="text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 transition">
          Pricing
        </Link>
        <Link href="/sign-in" className="text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 transition">
          Sign In
        </Link>
        <Link href="/sign-up" className="bg-slate-900 text-white text-xs sm:text-sm font-bold px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl hover:bg-blue-600 transition shadow-sm">
          Get Started
        </Link>
      </div>
    </nav>
  );
}