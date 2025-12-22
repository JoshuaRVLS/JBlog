"use client";

import { useRef } from "react";
import Image from "next/image";
import { Upload, Loader2, Save, User, Mail, FileText, Globe } from "lucide-react";

interface ProfileTabProps {
  name: string;
  setName: (name: string) => void;
  bio: string;
  setBio: (bio: string) => void;
  profilePicture: string | null;
  preview: string | null;
  uploading: boolean;
  savingProfile: boolean;
  user: any;
  website: string;
  setWebsite: (website: string) => void;
  location: string;
  setLocation: (location: string) => void;
  twitter: string;
  setTwitter: (twitter: string) => void;
  github: string;
  setGithub: (github: string) => void;
  linkedin: string;
  setLinkedin: (linkedin: string) => void;
  instagram: string;
  setInstagram: (instagram: string) => void;
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function ProfileTab({
  name,
  setName,
  bio,
  setBio,
  profilePicture,
  preview,
  uploading,
  savingProfile,
  user,
  website,
  setWebsite,
  location,
  setLocation,
  twitter,
  setTwitter,
  github,
  setGithub,
  linkedin,
  setLinkedin,
  instagram,
  setInstagram,
  onImageChange,
  onSubmit,
}: ProfileTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Edit Profile</h1>
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Profile Picture */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            {preview ? (
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-primary shadow-lg">
                <Image
                  src={preview}
                  alt="Profile preview"
                  fill
                  sizes="128px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center border-4 border-primary">
                <User className="h-16 w-16 text-muted-foreground" />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                <span>Ubah Foto Profil</span>
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onImageChange}
            className="hidden"
          />
          <p className="text-xs text-muted-foreground mt-2">
            PNG, JPG, GIF atau WEBP (max 5MB)
          </p>
        </div>

        {/* Name */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <User className="h-4 w-4" />
            Nama
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama kamu"
            className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            required
          />
        </div>

        {/* Email (Read-only) */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Mail className="h-4 w-4" />
            Email
          </label>
          <input
            type="email"
            value={user?.email || ""}
            disabled
            className="w-full px-4 py-3 rounded-lg border border-border bg-muted text-muted-foreground cursor-not-allowed"
          />
          <p className="text-xs text-muted-foreground">
            Email tidak bisa diubah
          </p>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <FileText className="h-4 w-4" />
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tulis bio singkat tentang kamu..."
            rows={4}
            className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-all"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Globe className="h-4 w-4" />
              Website
            </label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Globe className="h-4 w-4" />
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Jakarta, Indonesia"
              className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Social Media</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                Twitter / X
              </label>
              <input
                type="text"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                placeholder="@username"
                className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                GitHub
              </label>
              <input
                type="text"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="username"
                className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                LinkedIn
              </label>
              <input
                type="text"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="username"
                className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                Instagram
              </label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="username"
                className="w-full px-4 py-3 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={savingProfile}
            className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {savingProfile ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                <span>Simpan Perubahan</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

