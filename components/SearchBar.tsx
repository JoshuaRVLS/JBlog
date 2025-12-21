"use client";

import { useState, useEffect, useRef, useContext, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import AxiosInstance from "@/utils/api";
import { AuthContext } from "@/providers/AuthProvider";
import { Search, X, Clock, User, FileText, TrendingUp, Loader2, Sparkles } from "lucide-react";
import { generateAvatarUrl } from "@/utils/avatarGenerator";

interface SearchResult {
  posts: Array<{
    id: string;
    title: string;
    excerpt: string | null;
    coverImage: string | null;
    createdAt: string;
    author: {
      id: string;
      name: string;
      profilePicture: string | null;
    };
    _count: {
      claps: number;
      comments: number;
    };
  }>;
  users: Array<{
    id: string;
    name: string;
    email: string;
    bio: string | null;
    profilePicture: string | null;
    isVerified: boolean;
    _count: {
      posts: number;
      followers: number;
      following: number;
    };
  }>;
  query: string;
}

export default function SearchBar() {
  const { authenticated, userId } = useContext(AuthContext);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "posts" | "users">("all");
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionsFetchedRef = useRef<boolean>(false);

  // Fetch suggestions only when input is focused
  const fetchSuggestions = useCallback(async () => {
    if (suggestionsFetchedRef.current) return; // Already fetched
    
    try {
      setLoadingSuggestions(true);
      const response = await AxiosInstance.get("/search/suggestions", {
        params: { limit: 10 },
      });
      setSuggestions(response.data.suggestions || []);
      suggestionsFetchedRef.current = true;
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.trim().length < 2) {
      setResults(null);
      setShowResults(false);
      // Don't automatically show suggestions, only show when focused
      setShowSuggestions(false);
      return;
    }

    // Hide suggestions when user is typing
    setShowSuggestions(false);

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const type = activeTab === "all" ? undefined : activeTab;
        const response = await AxiosInstance.get("/search", {
          params: { q: query, type, limit: 10 },
        });
        setResults(response.data);
        setShowResults(true);
      } catch (error) {
        console.error("Error searching:", error);
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, activeTab]);

  const handlePostClick = (postId: string) => {
    router.push(`/posts/${postId}`);
    setShowResults(false);
    setQuery("");
  };

  const handleUserClick = (userId: string) => {
    router.push(`/users/${userId}`);
    setShowResults(false);
    setShowSuggestions(false);
    setQuery("");
  };

  const handleSuggestionClick = (suggestion: string) => {
    // Clear any pending debounced searches
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    setQuery(suggestion);
    setShowSuggestions(false);
    // Search will be triggered by useEffect when query changes
  };

  const totalResults = (results?.posts.length || 0) + (results?.users.length || 0);

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl z-[50] md:z-[300]" style={{ isolation: 'isolate' }}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Cari posts, users..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.trim().length >= 2) {
              setShowResults(true);
              setShowSuggestions(false);
            } else {
              // Don't show suggestions automatically on change, only on focus
              setShowSuggestions(false);
              setShowResults(false);
            }
          }}
          onFocus={() => {
            if (query.trim().length >= 2 && results) {
              setShowResults(true);
              setShowSuggestions(false);
            } else if (query.trim().length === 0) {
              fetchSuggestions(); // Fetch suggestions when focused
              setShowSuggestions(true);
              setShowResults(false);
            }
          }}
          className="w-full pl-12 pr-10 py-4 rounded-xl border-2 border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults(null);
              setShowResults(false);
              setShowSuggestions(false); // Don't auto-show suggestions, let user focus to see them
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-accent transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
        {loading && (
          <div className="absolute right-12 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Suggestions Dropdown (when input is empty or focused) */}
      {showSuggestions && query.trim().length === 0 && !loading && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border/50 rounded-xl shadow-2xl backdrop-blur-sm overflow-hidden z-[51] md:z-[301]">
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Saran Pencarian Populer</h3>
            </div>
          </div>
          {loadingSuggestions ? (
            <div className="p-8 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Memuat saran...</p>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="p-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-accent transition-colors group flex items-center gap-3"
                >
                  <Search className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                  <span className="text-sm text-foreground group-hover:text-primary transition-colors flex-1">
                    {suggestion}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-sm text-muted-foreground">Tidak ada saran tersedia</p>
            </div>
          )}
        </div>
      )}

      {/* Search Results Dropdown */}
      {showResults && query.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border/50 rounded-xl shadow-2xl max-h-[600px] overflow-y-auto backdrop-blur-sm z-[51] md:z-[301]">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Mencari...</p>
            </div>
          ) : results && totalResults > 0 ? (
            <>
              {/* Tabs */}
              <div className="flex border-b border-border">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === "all"
                      ? "text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Semua ({totalResults})
                </button>
                <button
                  onClick={() => setActiveTab("posts")}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === "posts"
                      ? "text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Posts ({results.posts.length})
                </button>
                <button
                  onClick={() => setActiveTab("users")}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === "users"
                      ? "text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Users ({results.users.length})
                </button>
              </div>

              {/* Results */}
              <div className="p-4 space-y-4">
                {/* Posts Results */}
                {(activeTab === "all" || activeTab === "posts") && results.posts.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-sm font-semibold text-foreground">Posts</h3>
                    </div>
                    <div className="space-y-2">
                      {results.posts.map((post) => (
                        <button
                          key={post.id}
                          onClick={() => handlePostClick(post.id)}
                          className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors group"
                        >
                          <div className="flex items-start gap-3">
                            {post.coverImage && (
                              <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                <Image
                                  src={post.coverImage}
                                  alt={post.title}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors line-clamp-1">
                                {post.title}
                              </h4>
                              {post.excerpt && (
                                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                  {post.excerpt}
                                </p>
                              )}
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Image
                                    src={
                                      post.author.profilePicture ||
                                      generateAvatarUrl(post.author.name)
                                    }
                                    alt={post.author.name}
                                    width={16}
                                    height={16}
                                    className="rounded-full"
                                  />
                                  <span>{post.author.name}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <TrendingUp className="h-3 w-3" />
                                  <span>{post._count.claps}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    {new Date(post.createdAt).toLocaleDateString("id-ID")}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Users Results */}
                {(activeTab === "all" || activeTab === "users") && results.users.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-sm font-semibold text-foreground">Users</h3>
                    </div>
                    <div className="space-y-2">
                      {results.users.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => handleUserClick(user.id)}
                          className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <Image
                              src={user.profilePicture || generateAvatarUrl(user.name)}
                              alt={user.name}
                              width={48}
                              height={48}
                              className="rounded-full flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">
                                  {user.name}
                                </h4>
                                {user.isVerified && (
                                  <span className="text-primary text-xs">✓</span>
                                )}
                              </div>
                              {user.bio && (
                                <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
                                  {user.bio}
                                </p>
                              )}
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span>{user._count.posts} posts</span>
                                <span>{user._count.followers} followers</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Tidak ada hasil untuk &quot;{query}&quot;
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

