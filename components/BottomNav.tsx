"use client";

import { usePathname, useRouter } from "next/navigation";
import { MapPin, Bookmark, Camera, User } from "lucide-react";

export type NavTab = "home" | "saved" | "report" | "profile";

interface BottomNavProps {
  active?: string;
  onChange?: (tab: NavTab) => void;
}

export default function BottomNav({ active, onChange }: BottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleTabClick = (tab: NavTab, route?: string) => {
    if (onChange) {
      onChange(tab);
    }
    if (route) {
      router.push(route);
    }
  };

  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[1000] w-[92%] max-w-md bg-[#050b18]/90 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3 flex items-center justify-between shadow-2xl">
      <button 
        onClick={() => handleTabClick("home", "/")}
        className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${(active === "home" || pathname === "/") ? "text-blue-400" : "text-slate-400 hover:text-white"}`}
      >
        <MapPin className="h-5 w-5" />
        <span className="text-[10px] font-medium">Home</span>
      </button>

      <button 
        onClick={() => handleTabClick("saved", "/savedroutes")}
        className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${(active === "saved" || pathname === "/savedroutes") ? "text-blue-400" : "text-slate-400 hover:text-white"}`}
      >
        <Bookmark className="h-5 w-5" />
        <span className="text-[10px] font-medium">Saved</span>
      </button>

      {/* Red/Orange Report Button matching your old screenshot style */}
      <button 
        onClick={() => handleTabClick("report")}
        className="flex flex-col items-center gap-1 cursor-pointer text-slate-300 hover:text-white group"
      >
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-600 to-red-600 flex items-center justify-center text-white shadow-xl -mt-6 border-4 border-[#050b18] group-hover:scale-105 transition-transform">
          <Camera className="h-5 w-5" />
        </div>
        <span className="text-[10px] font-bold text-slate-200 -mt-0.5">Report</span>
      </button>

      <button 
        onClick={() => handleTabClick("profile", "/profile")}
        className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${(active === "profile" || pathname === "/profile") ? "text-blue-400" : "text-slate-400 hover:text-white"}`}
      >
        <User className="h-5 w-5" />
        <span className="text-[10px] font-medium">Profile</span>
      </button>
    </div>
  );
}