import React, { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";

export type AgentDetails = {
  id: string;
  user_id?: string;
  name: string;
  phone: string;
  agentCode: string;
  region: string;
  status: string;
};

type UserContextValue = {
  user: any;
  agent: AgentDetails | null;
  name: string;
  phone: string;
  agentCode: string;
  region: string;
  profilePicture: string | null;
  setName: (name: string) => Promise<void>;
  setProfilePicture: (uri: string | null) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [agent, setAgent] = useState<AgentDetails | null>(null);
  const [name, setNameState] = useState<string>("এজেন্ট");
  const [phone, setPhoneState] = useState<string>("");
  const [agentCode, setAgentCodeState] = useState<string>("AGT-0000");
  const [region, setRegionState] = useState<string>("বগুড়া সদর, বগুড়া");
  const [profilePicture, setProfilePictureState] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const loadAgentProfile = useCallback(async (currentUser: any) => {
    if (!currentUser) {
      setUser(null);
      setAgent(null);
      setNameState("এজেন্ট");
      setPhoneState("");
      setAgentCodeState("AGT-0000");
      setRegionState("বগুড়া সদর, বগুড়া");
      setProfilePictureState(null);
      return;
    }

    setUser(currentUser);

    // Extract sanitized phone from dummy email (e.g., 01796133638@agro-trust.com -> 01796133638)
    const emailStr = currentUser.email || "";
    const rawPhoneFromEmail = emailStr.split("@")[0] || "";

    // Load stored user-specific profile picture
    const userPicKey = `@agro-agent-pic_${currentUser.id}`;
    try {
      const storedPic = await AsyncStorage.getItem(userPicKey);
      setProfilePictureState(storedPic || null);
    } catch (e) {
      console.error("Failed to load picture", e);
    }

    // Attempt to fetch agent record from Supabase database
    if (supabase) {
      try {
        let { data, error } = await supabase
          .from("agents")
          .select("*, assigned_areas(*)")
          .or(`user_id.eq.${currentUser.id},phone.eq.${rawPhoneFromEmail}`)
          .maybeSingle();

        if (data) {
          const agentIdFormatted = data.id 
            ? `AGT-${data.id.substring(0, 4).toUpperCase()}`
            : "AGT-0087";

          let assignedRegion = "বগুড়া সদর, বগুড়া";
          if (data.assigned_areas && data.assigned_areas.length > 0) {
            const area = data.assigned_areas[0];
            assignedRegion = `${area.upazila || area.district || 'বগুড়া সদর'}, ${area.district || 'বগুড়া'}`;
          }

          const agentDetails: AgentDetails = {
            id: data.id,
            user_id: data.user_id,
            name: data.name || "এজেন্ট",
            phone: data.phone || rawPhoneFromEmail,
            agentCode: agentIdFormatted,
            region: assignedRegion,
            status: data.status || "ACTIVE",
          };

          setAgent(agentDetails);
          setNameState(data.name || rawPhoneFromEmail || "এজেন্ট");
          setPhoneState(data.phone || rawPhoneFromEmail);
          setAgentCodeState(agentIdFormatted);
          setRegionState(assignedRegion);
          return;
        }
      } catch (err) {
        console.error("Error fetching agent profile from Supabase:", err);
      }
    }

    // Fallback if no specific agent row found in DB
    const fallbackName = currentUser.user_metadata?.name || rawPhoneFromEmail || "মাঠ পর্যায় এজেন্ট";
    const fallbackCode = `AGT-${currentUser.id ? currentUser.id.substring(0, 4).toUpperCase() : '0000'}`;
    
    setNameState(fallbackName);
    setPhoneState(rawPhoneFromEmail);
    setAgentCodeState(fallbackCode);
    setRegionState("বগুড়া সদর, বগুড়া");
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      await loadAgentProfile(currentUser);
    } catch (e) {
      console.error("Failed to refresh profile:", e);
    }
  }, [loadAgentProfile]);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (!supabase) {
        setIsLoaded(true);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          await loadAgentProfile(session?.user || null);
        }
      } catch (e) {
        console.error("Auth session load error", e);
      } finally {
        if (mounted) setIsLoaded(true);
      }
    }

    initAuth();

    // Listen for Auth changes (sign in, sign out, token refresh)
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
        if (mounted) {
          await loadAgentProfile(session?.user || null);
        }
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    }
  }, [loadAgentProfile]);

  // ── Automatic Real-Time GPS Location Tracker ──
  useEffect(() => {
    if (!user || !supabase) return;

    let locationTimer: ReturnType<typeof setInterval> | null = null;

    async function sendGpsPing() {
      try {
        const Location = await import("expo-location");
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const lat = location.coords.latitude;
        const lon = location.coords.longitude;
        const nowIso = new Date().toISOString();

        // 1. Fetch agent database UUID if not present
        let targetAgentId = agent?.id;
        if (!targetAgentId) {
          const rawPhone = (user.email || "").split("@")[0];
          const { data: agentData } = await supabase
            .from("agents")
            .select("id")
            .or(`user_id.eq.${user.id},phone.eq.${rawPhone}`)
            .maybeSingle();
          targetAgentId = agentData?.id;
        }

        if (targetAgentId) {
          // 2. Insert live location ping
          await supabase.from("agent_locations").insert([
            {
              agent_id: targetAgentId,
              latitude: lat,
              longitude: lon,
              recorded_at: nowIso,
            },
          ]);

          // 3. Update agent status and last_active_at timestamp
          await supabase
            .from("agents")
            .update({
              status: "ACTIVE",
              last_active_at: nowIso,
            })
            .eq("id", targetAgentId);
        }
      } catch (err) {
        console.warn("Auto GPS Ping error:", err);
      }
    }

    // Initial ping & recurring 15-second interval
    sendGpsPing();
    locationTimer = setInterval(sendGpsPing, 15000);

    return () => {
      if (locationTimer) clearInterval(locationTimer);
    };
  }, [user, agent?.id]);

  const setName = async (newName: string) => {
    setNameState(newName);
    if (user?.id) {
      try {
        await AsyncStorage.setItem(`@agro-agent-name_${user.id}`, newName);
      } catch (e) {
        console.error("Failed to save name", e);
      }
    }
  };

  const setProfilePicture = async (pic: string | null) => {
    setProfilePictureState(pic);
    if (user?.id) {
      try {
        const key = `@agro-agent-pic_${user.id}`;
        if (pic) {
          await AsyncStorage.setItem(key, pic);
        } else {
          await AsyncStorage.removeItem(key);
        }
      } catch (e) {
        console.error("Failed to save profile picture", e);
      }
    }
  };

  const logout = async () => {
    if (supabase) {
      try {
        let targetId = agent?.id;
        if (!targetId && user) {
          const rawPhone = (user.email || "").split("@")[0];
          const { data: agentData } = await supabase
            .from("agents")
            .select("id")
            .or(`user_id.eq.${user.id},phone.eq.${rawPhone}`)
            .maybeSingle();
          targetId = agentData?.id;
        }

        if (targetId) {
          await supabase
            .from("agents")
            .update({
              status: "OFFLINE",
              last_active_at: new Date().toISOString(),
            })
            .eq("id", targetId);
        }
      } catch (e) {
        console.error("Logout status update error", e);
      }
    }

    setUser(null);
    setAgent(null);
    setNameState("এজেন্ট");
    setPhoneState("");
    setAgentCodeState("AGT-0000");
    setRegionState("বগুড়া সদর, বগুড়া");
    setProfilePictureState(null);

    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error("Logout error", e);
      }
    }
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <UserContext.Provider
      value={{
        user,
        agent,
        name,
        phone,
        agentCode,
        region,
        profilePicture,
        setName,
        setProfilePicture,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
