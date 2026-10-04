"use client";

import { useRef, useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useT } from "@/lib/i18n/context";
import { useUser } from "@/lib/context/UserContext";
import { Camera, Trash2, CheckCircle2, LogOut } from "lucide-react";
import { clsx } from "clsx";
import { RequireAdmin } from "@/components/layout/RequireAdmin";
import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const t = useT();
  const { name, setName, profilePicture, setProfilePicture } = useUser();
  const { session, signOut } = useAuth();
  const router = useRouter();
  const [localName, setLocalName] = useState(name);
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  // Sync state if context changes externally
  useEffect(() => {
    setLocalName(name);
  }, [name]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setProfilePicture(event.target.result as string);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setProfilePicture(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = () => {
    setName(localName);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const getInitials = (fullName: string) => {
    if (!fullName) return "?";
    return fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <RequireAdmin>
    <AppShell>
      <div className="mx-auto max-w-3xl py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {t("profile.title")}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {t("profile.subtitle")}
            </p>
            {session?.user?.email && (
              <p className="mt-1 text-xs text-slate-400">Signed in as {session.user.email}</p>
            )}
          </div>
          <button
            onClick={handleSignOut}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {/* Avatar Section */}
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
            <div className="flex flex-col items-center gap-3">
              <div className="relative flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-brand-700 shadow-inner ring-1 ring-black/5">
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-semibold">
                    {getInitials(name)}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
                >
                  <Camera size={14} />
                  {t("profile.upload")}
                </button>
                {profilePicture && (
                  <button
                    onClick={handleRemoveImage}
                    className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-red-200 hover:bg-red-100"
                    aria-label={t("profile.remove")}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/jpeg, image/png, image/webp"
                  className="hidden"
                />
              </div>
            </div>

            <div className="flex-1 space-y-6 pt-2">
              <div>
                <h2 className="text-lg font-medium text-slate-900">
                  {t("profile.avatar_title")}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {t("profile.avatar_desc")}
                </p>
              </div>

              {/* Form Section */}
              <div className="max-w-md space-y-4">
                <div>
                  <label
                    htmlFor="displayName"
                    className="block text-sm font-medium text-slate-700"
                  >
                    {t("profile.name_label")}
                  </label>
                  <input
                    type="text"
                    id="displayName"
                    value={localName}
                    onChange={(e) => setLocalName(e.target.value)}
                    placeholder={t("profile.name_placeholder")}
                    className="mt-2 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm"
                  />
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={!localName.trim() || localName === name}
                    className={clsx(
                      "rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors",
                      !localName.trim() || localName === name
                        ? "bg-brand-300 cursor-not-allowed"
                        : "bg-brand-600 hover:bg-brand-700 shadow-sm"
                    )}
                  >
                    {t("profile.save")}
                  </button>
                  {isSaved && (
                    <span className="flex items-center gap-1.5 text-sm font-medium text-green-600 animate-in fade-in slide-in-from-left-2">
                      <CheckCircle2 size={16} />
                      {t("profile.saved_msg")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
    </RequireAdmin>
  );
}
