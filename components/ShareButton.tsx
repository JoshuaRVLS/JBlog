"use client";

import { useState } from "react";
import { Share2, Copy, Check, Twitter, Facebook, Linkedin } from "lucide-react";
import toast from "react-hot-toast";

interface ShareButtonProps {
  postId: string;
  title: string;
  className?: string;
}

export default function ShareButton({ postId, title, className = "" }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const postUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/posts/${postId}`
    : "";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      toast.success("Link berhasil disalin!");
      setTimeout(() => setCopied(false), 2000);
      setShowMenu(false);
    } catch (error) {
      toast.error("Gagal menyalin link");
    }
  };

  const shareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(postUrl)}`;
    window.open(url, "_blank", "width=550,height=420");
    setShowMenu(false);
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
    window.open(url, "_blank", "width=550,height=420");
    setShowMenu(false);
  };

  const shareToLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`;
    window.open(url, "_blank", "width=550,height=420");
    setShowMenu(false);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: title,
          url: postUrl,
        });
        setShowMenu(false);
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error("Error sharing:", error);
        }
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-accent transition-colors ${className}`}
      >
        <Share2 className="h-4 w-4" />
        <span className="text-sm">Share</span>
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
            <button
              onClick={handleNativeShare}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left"
            >
              <Share2 className="h-4 w-4" />
              <span className="text-sm">Share via...</span>
            </button>
            <div className="border-t border-border" />
            <button
              onClick={shareToTwitter}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left"
            >
              <Twitter className="h-4 w-4 text-blue-400" />
              <span className="text-sm">Twitter</span>
            </button>
            <button
              onClick={shareToFacebook}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left"
            >
              <Facebook className="h-4 w-4 text-blue-600" />
              <span className="text-sm">Facebook</span>
            </button>
            <button
              onClick={shareToLinkedIn}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left"
            >
              <Linkedin className="h-4 w-4 text-blue-700" />
              <span className="text-sm">LinkedIn</span>
            </button>
            <div className="border-t border-border" />
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-500">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span className="text-sm">Copy Link</span>
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

