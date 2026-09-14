"use client";

import { useState, useEffect } from "react";
import { Navigation, AlertTriangle, CheckCircle2, X, Volume2, Compass, MapPin } from "lucide-react";

type NavOverlayProps = {
  start: string;
  destination: string;
  onClose: () => void;
};

const STEPS = [
  { instruction: "Head southeast on Anna Nagar 2nd Ave", dist: "180m", warning: false },
  { instruction: "⚠️ High Risk Pothole ahead! Slow down.", dist: "350m", warning: true },
  { instruction: "Turn right towards Kodambakkam Bridge", dist: "900m", warning: false },
  { instruction: "Continue straight on LB Road, Adyar", dist: "1.8 km", warning: false },
  { instruction: "Arrived at destination safely! 🎉 Chitti Score +20", dist: "Destination", warning: false },
];

export default function NavigationOverlay({ start, destination, onClose }: NavOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [speed, setSpeed] = useState("35 km/h"); // Simulated driving/walking speed
  const [gpsAccuracy, setGpsAccuracy] = useState("High (GPS Locked)");

  // Live Navigation Simulation (Moves step-by-step like Google Maps)
  useEffect(() => {
    if (!isNavigating) return;
    
    // Request actual device GPS if available
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setGpsAccuracy(`±${Math.round(position.coords.accuracy)}m (Live GPS)`);
        },
        (error) => console.log("GPS watch error:", error),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [isNavigating]);

  // Step progression timer (Simulating moving along the route)
  useEffect(() => {
    if (!isNavigating) return;
    
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < STEPS.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          return prev;
        }
      });
    }, 5000); // Every 5 seconds user "moves" to next checkpoint

    return () => clearInterval(interval);
  }, [isNavigating]);

  return (
    <div className="absolute inset-x-0 top-0 z-50 p-4 pointer-events-auto animate-in slide-in-from-top-4 duration-300">
      <div className="w-full max-w-md mx-auto bg-navy-950/95 backdrop-blur-2xl rounded-2xl border border-blue-500/30 shadow-[0_0_30px_rgba(37,99,235,0.2)] overflow-hidden flex flex-col text-white">
        
        {/* Top Header */}
        <div className="p-4 bg-black/60 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Navigation className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm">Live Navigation Active</h3>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
              </div>
              <p className="text-[11px] text-chitti-mist truncate max-w-[200px]">{start} → {destination}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {/* Live Turn-by-Turn Guidance Card */}
        {isNavigating ? (
          <div className={`p-5 transition-all ${STEPS[currentStep].warning ? 'bg-red-950/50 border-b border-red-500/40' : 'bg-blue-950/20 border-b border-blue-500/20'}`}>
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-2xl shadow-inner ${STEPS[currentStep].warning ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                {STEPS[currentStep].warning ? <AlertTriangle className="h-7 w-7 animate-bounce" /> : <Compass className="h-7 w-7 animate-spin-slow" />}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-chitti-cyan font-bold tracking-wider uppercase">Next Checkpoint</span>
                  <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-gray-300 font-mono">{STEPS[currentStep].dist}</span>
                </div>
                <p className={`font-bold text-base leading-snug ${STEPS[currentStep].warning ? 'text-red-300' : 'text-white'}`}>
                  {STEPS[currentStep].instruction}
                </p>
              </div>
            </div>

            {/* Live Telemetry Bar (Speed & GPS status like Uber/GMap) */}
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-gray-400">
              <span className="flex items-center gap-1 font-mono text-chitti-mist">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Speed: {speed}
              </span>
              <span className="flex items-center gap-1 font-mono text-green-400">
                <MapPin className="h-3 w-3" /> {gpsAccuracy}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-black/40 flex flex-col items-center text-center space-y-3">
            <div className="p-3 bg-blue-500/10 rounded-full border border-blue-500/20 text-blue-400 mb-1">
              <Navigation className="h-8 w-8" />
            </div>
            <h4 className="font-bold text-white text-base">Ready to start journey?</h4>
            <p className="text-xs text-chitti-mist max-w-xs">Chitti AI has scanned the route. 2 dangerous potholes are flagged along your path.</p>
            <button 
              onClick={() => setIsNavigating(true)} 
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <Navigation className="h-5 w-5" /> Start Live Guidance
            </button>
          </div>
        )}

        {/* Footer controls when navigating */}
        {isNavigating && (
          <div className="px-5 py-3 bg-black/80 flex items-center justify-between text-xs border-t border-white/10">
            <span className="text-chitti-mist font-medium">Progress: Step {currentStep + 1} of {STEPS.length}</span>
            <button 
              onClick={() => {
                setIsNavigating(false);
                setCurrentStep(0);
              }} 
              className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 font-semibold border border-red-500/20 transition-all"
            >
              End Trip
            </button>
          </div>
        )}

      </div>
    </div>
  );
}