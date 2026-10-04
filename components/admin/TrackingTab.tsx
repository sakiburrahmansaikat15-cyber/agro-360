"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { Card } from "@/components/ui/PageHeader";
import {
  MapPin,
  Navigation,
  Radio,
  RefreshCw,
  UserCheck,
  Shield,
  Phone,
  Clock,
  X,
  ChevronRight,
  Search,
  CheckSquare,
  Footprints,
  Layers,
  Globe,
  Maximize2,
} from "lucide-react";
import { useT } from "@/lib/i18n/context";
import { supabase } from "@/lib/supabase";

type LocationPing = {
  id: string;
  latitude: number;
  longitude: number;
  recorded_at: string;
};

type AgentTrackInfo = {
  id: string;
  name: string;
  phone: string;
  status: string;
  last_active_at: string | null;
  latitude: number;
  longitude: number;
  last_ping_at: string | null;
  assignedArea: {
    division: string;
    district: string;
    upazila: string;
    union_name: string;
  } | null;
  currentTask: {
    title: string;
    priority: string;
    status: string;
    due_date?: string;
  } | null;
  locationHistory: LocationPing[];
};

export function TrackingTab() {
  const t = useT();
  const [agentsTrackList, setAgentsTrackList] = useState<AgentTrackInfo[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentTrackInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ONLINE" | "OFFLINE">("ALL");
  const [showRouteHistory, setShowRouteHistory] = useState(false);
  const [mapLayer, setMapLayer] = useState<"googleRoad" | "googleSatellite" | "googleTerrain" | "cartoDark">("googleRoad");

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const polylineRef = useRef<any>(null);

  // Load Leaflet CSS
  useEffect(() => {
    if (typeof window !== "undefined" && !document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
  }, []);

  // Initialize Real Leaflet / Google Maps Engine
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let isMounted = true;

    async function initLeaflet() {
      const L = await import("leaflet");

      if (!isMounted || !mapContainerRef.current) return;

      if (!leafletMapRef.current) {
        // Center on Bangladesh (23.6850, 90.3563), Zoom 7
        const map = L.map(mapContainerRef.current, {
          center: [23.6850, 90.3563],
          zoom: 7,
          zoomControl: false,
        });

        // Add Google Maps Road tile layer default
        const tileLayer = L.tileLayer("https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
          maxZoom: 20,
          attribution: "&copy; Google Maps",
        }).addTo(map);

        L.control.zoom({ position: "topright" }).addTo(map);

        leafletMapRef.current = { map, tileLayer, L };
      }
    }

    initLeaflet();

    return () => {
      isMounted = false;
    };
  }, []);

  // Update Map Tile Layer based on user selection
  useEffect(() => {
    if (!leafletMapRef.current) return;
    const { map, tileLayer, L } = leafletMapRef.current;

    let newUrl = "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";
    if (mapLayer === "googleSatellite") {
      newUrl = "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}";
    } else if (mapLayer === "googleTerrain") {
      newUrl = "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}";
    } else if (mapLayer === "cartoDark") {
      newUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
    }

    if (tileLayer) {
      map.removeLayer(tileLayer);
    }

    const nextTileLayer = L.tileLayer(newUrl, {
      maxZoom: 20,
      subdomains: "abcd",
      attribution: "&copy; Google Maps / OpenStreetMap",
    }).addTo(map);

    leafletMapRef.current.tileLayer = nextTileLayer;
  }, [mapLayer]);

  // Load Real-time Agent Locations Data from Supabase
  useEffect(() => {
    loadTrackingData();

    if (supabase) {
      const channel = supabase
        .channel("tracking_tab_google_maps")
        .on("postgres_changes", { event: "*", schema: "public", table: "agent_locations" }, loadTrackingData)
        .on("postgres_changes", { event: "*", schema: "public", table: "agents" }, loadTrackingData)
        .on("postgres_changes", { event: "*", schema: "public", table: "assigned_areas" }, loadTrackingData)
        .on("postgres_changes", { event: "*", schema: "public", table: "task_assignments" }, loadTrackingData)
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  async function loadTrackingData() {
    setLoading(true);
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch Agents
      const { data: agentsData } = await supabase
        .from("agents")
        .select("id, name, phone, status, last_active_at")
        .order("name", { ascending: true });

      // 2. Fetch Locations
      const { data: locationsData } = await supabase
        .from("agent_locations")
        .select("id, agent_id, latitude, longitude, recorded_at")
        .order("recorded_at", { ascending: false });

      // 3. Fetch Assigned Areas
      const { data: areasData } = await supabase
        .from("assigned_areas")
        .select("agent_id, division, district, upazila, union_name");

      // 4. Fetch Active Tasks with Assignments
      const { data: tasksData } = await supabase
        .from("task_assignments")
        .select("agent_id, status, tasks(title, priority, due_date)")
        .order("created_at", { ascending: false });

      if (agentsData) {
        const compiled: AgentTrackInfo[] = agentsData.map((ag: any) => {
          const agentPings = (locationsData || []).filter((loc: any) => loc.agent_id === ag.id);
          const latestPing = agentPings[0];
          const areaObj = (areasData || []).find((ar: any) => ar.agent_id === ag.id);
          const taskAssign = (tasksData || []).find((ta: any) => ta.agent_id === ag.id);
          const currentTask = taskAssign?.tasks
            ? {
                title: (taskAssign.tasks as any).title || "মাঠ পরিদর্শনের কাজ",
                priority: (taskAssign.tasks as any).priority || "NORMAL",
                status: taskAssign.status || "IN_PROGRESS",
                due_date: (taskAssign.tasks as any).due_date,
              }
            : null;

          // Default fallback coordinates if no location ping yet (Bogra 24.8481, 89.3730)
          const lat = latestPing ? Number(latestPing.latitude) : 24.8481;
          const lon = latestPing ? Number(latestPing.longitude) : 89.373;

          return {
            id: ag.id,
            name: ag.name || "মাঠ কর্মী",
            phone: ag.phone || "-",
            status: ag.status || "ACTIVE",
            last_active_at: ag.last_active_at,
            latitude: lat,
            longitude: lon,
            last_ping_at: latestPing ? latestPing.recorded_at : ag.last_active_at,
            assignedArea: areaObj
              ? {
                  division: areaObj.division,
                  district: areaObj.district,
                  upazila: areaObj.upazila,
                  union_name: areaObj.union_name,
                }
              : null,
            currentTask,
            locationHistory: agentPings.map((p: any) => ({
              id: p.id,
              latitude: Number(p.latitude),
              longitude: Number(p.longitude),
              recorded_at: p.recorded_at,
            })),
          };
        });

        setAgentsTrackList(compiled);
      }
    } catch (err) {
      console.error("Error loading live tracking data:", err);
    } finally {
      setLoading(false);
    }
  }

  // Filtered Agents List
  const filteredAgents = useMemo(() => {
    return agentsTrackList.filter((ag) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        ag.name.toLowerCase().includes(q) ||
        ag.phone.includes(q) ||
        (ag.assignedArea && ag.assignedArea.district.toLowerCase().includes(q));

      if (!matchSearch) return false;

      const online = isRecentlyActive(ag.last_ping_at, ag.status);
      if (statusFilter === "ONLINE" && !online) return false;
      if (statusFilter === "OFFLINE" && online) return false;

      return true;
    });
  }, [agentsTrackList, searchQuery, statusFilter]);

  const onlineCount = useMemo(() => {
    return agentsTrackList.filter((ag) => isRecentlyActive(ag.last_ping_at, ag.status)).length;
  }, [agentsTrackList]);

  // Update Real Leaflet Markers on Map
  useEffect(() => {
    if (!leafletMapRef.current) return;
    const { map, L } = leafletMapRef.current;

    // Clear old markers
    Object.values(markersRef.current).forEach((m) => map.removeLayer(m));
    markersRef.current = {};

    filteredAgents.forEach((agent) => {
      const online = isRecentlyActive(agent.last_ping_at, agent.status);

      // Custom Google-style Pin HTML Marker
      const customIcon = L.divIcon({
        className: "custom-google-marker",
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
            <div style="
              width: 38px;
              height: 38px;
              border-radius: 50%;
              background: ${online ? "#166534" : "#475569"};
              border: 3px solid #ffffff;
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              color: #ffffff;
              font-weight: bold;
              font-size: 13px;
              font-family: sans-serif;
            ">
              ${agent.name.charAt(0).toUpperCase()}
            </div>
            <div style="
              background: rgba(15, 23, 42, 0.9);
              color: #ffffff;
              font-size: 10px;
              font-weight: bold;
              padding: 2px 8px;
              border-radius: 12px;
              margin-top: 4px;
              white-space: nowrap;
              border: 1px solid rgba(255,255,255,0.2);
              box-shadow: 0 2px 6px rgba(0,0,0,0.2);
            ">
              ${agent.name} ${online ? "🟢" : "⚪"}
            </div>
          </div>
        `,
        iconSize: [40, 50],
        iconAnchor: [20, 45],
      });

      const marker = L.marker([agent.latitude, agent.longitude], { icon: customIcon }).addTo(map);

      marker.on("click", () => {
        setSelectedAgent(agent);
        map.flyTo([agent.latitude, agent.longitude], 12, { animate: true, duration: 1 });
      });

      markersRef.current[agent.id] = marker;
    });
  }, [filteredAgents]);

  // Update Route Polyline Trail on Selected Agent Change
  useEffect(() => {
    if (!leafletMapRef.current) return;
    const { map, L } = leafletMapRef.current;

    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }

    if (showRouteHistory && selectedAgent && selectedAgent.locationHistory.length > 1) {
      const latLngs = selectedAgent.locationHistory.map((p) => [p.latitude, p.longitude]);
      polylineRef.current = L.polyline(latLngs, {
        color: "#166534",
        weight: 4,
        dashArray: "6, 6",
      }).addTo(map);
      map.fitBounds(polylineRef.current.getBounds(), { padding: [50, 50] });
    }
  }, [showRouteHistory, selectedAgent]);

  // Center on Bangladesh
  const centerBangladesh = () => {
    if (leafletMapRef.current) {
      leafletMapRef.current.map.flyTo([23.6850, 90.3563], 7, { animate: true, duration: 1 });
    }
  };

  return (
    <Card title={t("admin.tracking.title")} subtitle={t("admin.tracking.subtitle")}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        {/* Left 2 Cols: Google Maps Interactive Live Tile Engine */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white h-[640px] relative overflow-hidden flex flex-col justify-between shadow-lg">
          {/* Top Floating Control Bar */}
          <div className="absolute top-4 left-4 right-4 z-[400] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200 shadow-md">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-700">
                <Navigation size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  গুগল ম্যাপস লাইভ জিপিএস ট্র্যাকিং
                  <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
                    <Radio className="h-3 w-3 animate-pulse text-emerald-600" />
                    Google Maps Stream
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  অনলাইন এজেন্ট: <strong className="text-emerald-700">{onlineCount} জন</strong> | মোট এজেন্ট: {agentsTrackList.length} জন
                </p>
              </div>
            </div>

            {/* Map Style Selector */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-1">
                <button
                  onClick={() => setMapLayer("googleRoad")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    mapLayer === "googleRoad" ? "bg-white text-brand-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Map (ম্যাপ)
                </button>
                <button
                  onClick={() => setMapLayer("googleSatellite")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    mapLayer === "googleSatellite" ? "bg-white text-brand-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Satellite (স্যাটেলাইট)
                </button>
                <button
                  onClick={() => setMapLayer("cartoDark")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    mapLayer === "cartoDark" ? "bg-white text-brand-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Dark
                </button>
              </div>

              <button
                onClick={centerBangladesh}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 border border-slate-200 transition-colors"
                title="Center Bangladesh"
              >
                <Globe size={14} /> কেন্দ্র
              </button>
            </div>
          </div>

          {/* Leaflet Map Div Container */}
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Bottom Overlay Legend & Actions */}
          <div className="absolute bottom-4 left-4 right-4 z-[400] bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200 flex items-center justify-between text-xs text-slate-700 shadow-md">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-emerald-700 border border-white" />
                <strong className="text-slate-900">অনলাইন (Online)</strong> ({onlineCount})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-slate-600 border border-white" />
                <strong className="text-slate-600">অফলাইন (Offline)</strong> ({agentsTrackList.length - onlineCount})
              </span>
            </div>

            {selectedAgent && (
              <button
                onClick={() => setShowRouteHistory((prev) => !prev)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                  showRouteHistory
                    ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                    : "bg-slate-100 text-brand-700 border-slate-200 hover:bg-slate-200"
                }`}
              >
                <Footprints size={14} />
                {showRouteHistory ? "মুভমেন্ট রুট ট্রেইল বন্ধ করুন" : "মুভমেন্ট রুট ট্রেইল দেখুন"}
              </button>
            )}
          </div>
        </div>

        {/* Right 1 Col: Agent Roster List */}
        <div className="border border-slate-200/80 rounded-2xl bg-white overflow-hidden flex flex-col shadow-sm">
          <div className="bg-slate-50 p-3.5 border-b border-slate-100 font-bold text-xs text-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <UserCheck size={16} className="text-brand-600" /> এজেন্ট রিয়েল-টাইম জিপিএস লিস্ট
            </span>
            <span className="text-[11px] bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold border border-emerald-200">
              {onlineCount} Online
            </span>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="p-3 border-b border-slate-100 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search agent name, phone or district..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  statusFilter === "ALL" ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                সব ({agentsTrackList.length})
              </button>
              <button
                onClick={() => setStatusFilter("ONLINE")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  statusFilter === "ONLINE" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                অনলাইন ({onlineCount})
              </button>
              <button
                onClick={() => setStatusFilter("OFFLINE")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  statusFilter === "OFFLINE" ? "bg-slate-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                অফলাইন ({agentsTrackList.length - onlineCount})
              </button>
            </div>
          </div>

          {/* Scroll List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[500px]">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">জিপিএস লোকেশন লোড হচ্ছে...</div>
            ) : filteredAgents.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">কোনো এজেন্ট পাওয়া যায়নি।</div>
            ) : (
              filteredAgents.map((ag) => {
                const online = isRecentlyActive(ag.last_ping_at, ag.status);
                const isSelected = selectedAgent?.id === ag.id;

                return (
                  <div
                    key={ag.id}
                    onClick={() => {
                      setSelectedAgent(ag);
                      if (leafletMapRef.current) {
                        leafletMapRef.current.map.flyTo([ag.latitude, ag.longitude], 13, { animate: true, duration: 1 });
                      }
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "bg-brand-50/80 border-brand-300 shadow-sm"
                        : "bg-slate-50/80 border-slate-100 hover:bg-slate-100/80"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs border ${
                        online
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : "bg-slate-200 text-slate-600 border-slate-300"
                      }`}>
                        {ag.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          {ag.name}
                          <span className={`h-2 w-2 rounded-full ${online ? "bg-emerald-500" : "bg-slate-300"}`} />
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {ag.assignedArea ? `${ag.assignedArea.upazila || ag.assignedArea.district}, ${ag.assignedArea.district}` : "বগুড়া সদর"}
                        </div>
                      </div>
                    </div>

                    <ChevronRight size={14} className="text-slate-400" />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Interactive Agent Inspector Modal Drawer ── */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-slate-900/50 z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-brand-100 border border-brand-200 flex items-center justify-center text-brand-800 font-bold text-sm">
                  {selectedAgent.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{selectedAgent.name}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Phone size={12} className="text-slate-400" /> {selectedAgent.phone}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedAgent(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Online/Offline Status */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs text-slate-500 font-medium">লাইভ স্ট্যাটাস (Online Status):</span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  isRecentlyActive(selectedAgent.last_ping_at, selectedAgent.status)
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-slate-100 text-slate-600 border border-slate-200"
                }`}>
                  <span className={`h-2 w-2 rounded-full ${isRecentlyActive(selectedAgent.last_ping_at, selectedAgent.status) ? "bg-emerald-500" : "bg-slate-400"}`} />
                  {isRecentlyActive(selectedAgent.last_ping_at, selectedAgent.status) ? "ONLINE (অনলাইন)" : "OFFLINE (অফলাইন)"}
                </span>
              </div>

              {/* Live Location Card */}
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                  <Navigation size={15} className="text-emerald-700" />
                  বর্তমান গুগল ম্যাপস জিপিএস স্থানাঙ্ক (Current Coordinates)
                </div>
                <div className="text-sm font-mono font-bold text-emerald-800">
                  {selectedAgent.latitude?.toFixed(5)}° N, {selectedAgent.longitude?.toFixed(5)}° E
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                  <Clock size={12} className="text-slate-400" />
                  সর্বশেষ আপডেট: {selectedAgent.last_ping_at ? new Date(selectedAgent.last_ping_at).toLocaleString() : "এখনই"}
                </div>
              </div>

              {/* Current Assigned Task Card */}
              <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200/80 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                  <CheckSquare size={15} className="text-indigo-700" />
                  বর্তমান অর্পিত কাজ (Current Assigned Task)
                </div>
                {selectedAgent.currentTask ? (
                  <div>
                    <div className="text-xs font-bold text-slate-900">{selectedAgent.currentTask.title}</div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                        {selectedAgent.currentTask.priority} Priority
                      </span>
                      <span className="text-[11px] text-slate-500">
                        স্ট্যাটাস: {selectedAgent.currentTask.status}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500">বর্তমানে কোনো কাজ অর্পণ করা নেই।</div>
                )}
              </div>

              {/* Assigned Area Info */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <Shield size={15} className="text-brand-600" />
                  বরাদ্দকৃত এলাকা (Assigned Area)
                </div>
                {selectedAgent.assignedArea ? (
                  <div className="text-xs text-slate-700 space-y-1">
                    <div>বিভাগ: <strong>{selectedAgent.assignedArea.division}</strong></div>
                    <div>জেলা: <strong>{selectedAgent.assignedArea.district}</strong></div>
                    <div>উপজেলা: <strong>{selectedAgent.assignedArea.upazila}</strong></div>
                    {selectedAgent.assignedArea.union_name && (
                      <div>ইউনিয়ন: <strong>{selectedAgent.assignedArea.union_name}</strong></div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500">বগুড়া সদর, বগুড়া জেলা (ডিফল্ট)</div>
                )}
              </div>

              {/* Movement Route Toggle */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <button
                  onClick={() => setShowRouteHistory((prev) => !prev)}
                  className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all ${
                    showRouteHistory
                      ? "bg-brand-600 text-white shadow-sm"
                      : "bg-slate-100 text-brand-700 hover:bg-slate-200"
                  }`}
                >
                  <Footprints size={15} />
                  {showRouteHistory ? "মুভমেন্ট ট্রেইল বন্ধ করুন" : "মুভমেন্ট ট্রেইল হিস্ট্রি দেখান"}
                </button>

                <button
                  onClick={() => setSelectedAgent(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200"
                >
                  বন্ধ করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function isRecentlyActive(timestampStr: string | null, status?: string): boolean {
  // A manually-set OFFLINE status always wins. Note: status is *not* used
  // as a shortcut for "online" — agents.status defaults to 'ACTIVE' for
  // every agent and nothing flips it automatically, so treating ACTIVE as
  // "currently online" made every agent appear live forever regardless of
  // whether they had ever actually sent a GPS ping. "Online" is determined
  // solely by ping recency below.
  if (status === "OFFLINE") return false;

  if (!timestampStr) return false;
  const now = new Date().getTime();
  const pingTime = new Date(timestampStr).getTime();
  if (isNaN(pingTime)) return false;

  return Math.abs(now - pingTime) < 15 * 60 * 1000;
}
