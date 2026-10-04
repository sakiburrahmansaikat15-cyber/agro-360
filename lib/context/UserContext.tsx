"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type UserContextValue = {
  name: string;
  setName: (name: string) => void;
  profilePicture: string | null;
  setProfilePicture: (dataUrl: string | null) => void;
};

const UserContext = createContext<UserContextValue | null>(null);

const STORAGE_KEY_NAME = "agro-trust-360-username";
const STORAGE_KEY_PIC = "agro-trust-360-profile-pic";

export function UserProvider({ children }: { children: ReactNode }) {
  const [name, setNameState] = useState("Ministry of Agriculture");
  const [profilePicture, setProfilePictureState] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const storedName = window.localStorage.getItem(STORAGE_KEY_NAME);
    if (storedName) {
      setNameState(storedName);
    }
    const storedPic = window.localStorage.getItem(STORAGE_KEY_PIC);
    if (storedPic) {
      setProfilePictureState(storedPic);
    }
  }, []);

  const setName = (newName: string) => {
    setNameState(newName);
    window.localStorage.setItem(STORAGE_KEY_NAME, newName);
  };

  const setProfilePicture = (pic: string | null) => {
    setProfilePictureState(pic);
    if (pic) {
      window.localStorage.setItem(STORAGE_KEY_PIC, pic);
    } else {
      window.localStorage.removeItem(STORAGE_KEY_PIC);
    }
  };

  // Prevent hydration mismatch by rendering default initially
  if (!isMounted) {
    return (
      <UserContext.Provider value={{ name: "Ministry of Agriculture", setName, profilePicture: null, setProfilePicture }}>
        {children}
      </UserContext.Provider>
    );
  }

  return (
    <UserContext.Provider value={{ name, setName, profilePicture, setProfilePicture }}>
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
