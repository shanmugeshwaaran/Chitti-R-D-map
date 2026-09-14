"use client";

import { useState } from "react";
import { Lock, Mail, User, Phone, ArrowLeft, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email && password) {
      alert("✅ Registration Successful! Please login.");
      router.push("/login");
    } else {
      alert("Please fill all required fields.");
    }
  };

  return (
    <main className="min-h-screen bg-navy-950 font-body text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-black/50 backdrop-blur-2xl border border-white/15 rounded-3xl p-8 shadow-2xl relative">
        
        <Link href="/" className="absolute top-6 left-6 text-chitti-mist hover:text-white text-xs flex items-center gap-1 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Map
        </Link>

        <div className="text-center mt-4 mb-6">
          <Image src="/chitti_mother_square-min.png" alt="Chitti Logo" width={48} height={48} className="mx-auto mb-3 rounded-xl" />
          <h1 className="text-2xl font-bold">Create Student Account</h1>
          <p className="text-xs text-chitti-mist mt-1">Join CEYAL STEM community for safe routing.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-3.5">
          <div>
            <label className="text-xs text-chitti-mist block mb-1">Full Name</label>
            <div className="relative">
              <input 
                type="text" 
                required
                placeholder="Karthi Kumar" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 pl-11 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="text-xs text-chitti-mist block mb-1">Email ID</label>
            <div className="relative">
              <input 
                type="email" 
                required
                placeholder="student@ceyal.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 pl-11 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="text-xs text-chitti-mist block mb-1">Mobile Number</label>
            <div className="relative">
              <input 
                type="tel" 
                required
                placeholder="+91 98422 12345" 
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 pl-11 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="text-xs text-chitti-mist block mb-1">Secret Passcode</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required
                placeholder="Create secret passcode" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 pl-11 pr-12 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              
              {/* Show / Hide Eye Button */}
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all text-sm mt-3"
          >
            Register Student Account
          </button>
        </form>

        <p className="text-center text-xs text-chitti-mist mt-5">
          Already registered? <Link href="/login" className="text-blue-400 hover:underline font-semibold">Login here</Link>
        </p>

      </div>
    </main>
  );
}