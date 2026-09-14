"use client";

import { useState } from "react";
import { Bookmark, ArrowLeft, MapPin, Navigation, Trash2, Plus, Play } from "lucide-react";
import Link from "next/link";

// Dummy saved routes data
const INITIAL_SAVED_ROUTES = [
  {
    id: 1,
    routeName: "Home to CEYAL Labs",
    start: "Anna Nagar West",
    destination: "Guindy National Park",
    potholesAvoided: 3,
    distance: "12.4 km",
    time: "25 mins",
  },
  {
    id: 2,
    routeName: "College to Library",
    start: "SRM Adyar Campus",
    destination: "Egmore Railway Station",
    potholesAvoided: 5,
    distance: "8.1 km",
    time: "18 mins",
  },
];

export default function SavedRoutesPage() {
  const [routes, setRoutes] = useState(INITIAL_SAVED_ROUTES);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form states for new saved route
  const [newTitle, setNewTitle] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newDest, setNewDest] = useState("");

  const handleAddRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newStart || !newDest) return;

    const newRouteObj = {
      id: Date.now(),
      routeName: newTitle,
      start: newStart,
      destination: newDest,
      potholesAvoided: 2,
      distance: "10.0 km",
      time: "22 mins",
    };

    setRoutes([newRouteObj, ...routes]);
    setNewTitle("");
    setNewStart("");
    setNewDest("");
    setShowAddModal(false);
  };

  const handleDelete = (id: number) => {
    setRoutes(routes.filter((r) => r.id !== id));
  };

  return (
    <main className="min-h-screen bg-navy-950 font-body text-white p-6 md:p-10 flex flex-col items-center">
      
      {/* Top Header Row */}
      <div className="w-full max-w-3xl flex items-center justify-between mb-8">
        <Link href="/" className="flex items-center gap-2 text-chitti-mist hover:text-white bg-white/5 px-4 py-2 rounded-xl border border-white/10 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Map
        </Link>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all"
        >
          <Plus className="h-4 w-4" /> Save New Route
        </button>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-500/20 text-blue-400 rounded-2xl border border-blue-500/30">
            <Bookmark className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Saved Routes</h1>
            <p className="text-xs text-chitti-mist">Quick access to your frequently travelled paths with pothole safety alerts.</p>
          </div>
        </div>

        {/* Routes Grid / List */}
        <div className="space-y-4">
          {routes.length === 0 ? (
            <div className="text-center py-20 bg-black/30 rounded-3xl border border-white/10 text-chitti-mist">
              <Bookmark className="h-12 w-12 mx-auto mb-3 opacity-40 text-blue-400" />
              <p>No saved routes found.</p>
              <p className="text-xs text-gray-500 mt-1">Save your daily commute routes for instant navigation.</p>
            </div>
          ) : (
            routes.map((route) => (
              <div key={route.id} className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl hover:border-white/20 transition-all">
                
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-lg text-white">{route.routeName}</h3>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
                      🛡️ {route.potholesAvoided} Potholes Avoided
                    </span>
                  </div>

                  <div className="text-xs space-y-1 text-chitti-mist">
                    <p className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-chitti-cyan inline-block"></span> 
                      <strong className="text-gray-300">From:</strong> {route.start}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span> 
                      <strong className="text-gray-300">To:</strong> {route.destination}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-gray-400 pt-1 font-mono">
                    <span>📏 Distance: {route.distance}</span>
                    <span>⏱️ Est Time: {route.time}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-white/10 justify-end">
                  <Link 
                    href="/" 
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" /> Start Navigation
                  </Link>
                  <button 
                    onClick={() => handleDelete(route.id)}
                    className="p-2.5 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-xl border border-white/10 transition-colors"
                    title="Delete Saved Route"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Route Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-navy-950 border border-white/15 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <h2 className="text-xl font-bold mb-4">Save New Route</h2>
            
            <form onSubmit={handleAddRoute} className="space-y-4">
              <div>
                <label className="text-xs text-chitti-mist block mb-1">Route Nickname</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g., Home to Office" 
                  value={newTitle} 
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs text-chitti-mist block mb-1">Starting Location</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g., Anna Nagar" 
                  value={newStart} 
                  onChange={(e) => setNewStart(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs text-chitti-mist block mb-1">Destination Location</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g., Velachery" 
                  value={newDest} 
                  onChange={(e) => setNewDest(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-300 font-semibold rounded-xl border border-white/10 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all text-sm"
                >
                  Save Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}