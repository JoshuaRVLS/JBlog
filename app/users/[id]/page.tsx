"use client";

import { useState, useEffect, useContext } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar/Navbar";
import AxiosInstance from "@/utils/api";
import { AuthContext } from "@/providers/AuthProvider";
import { User, Calendar, Heart, MessageCircle, Clock, Loader2, Sparkles, X, Settings, ExternalLink, ArrowUpDown, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";
import { generateAvatarUrl } from "@/utils/avatarGenerator";

interface CustomLink {
  id: string;
  label: string;
  url: string;
  order: number;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  bio: string | null;
  description: string | null;
  profilePicture: string | null;
  customCSS?: string | null;
  customLinks?: CustomLink[];
  createdAt: string;
  _count: {
    posts: number;
    followers: number;
    following: number;
  };
}

interface Post {
  id: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  readingTime: number;
  createdAt: string;
  _count: {
    claps: number;
    comments: number;
  };
}

interface FollowerFollowing {
  id: string;
  follower?: {
    id: string;
    name: string;
    profilePicture: string | null;
    bio: string | null;
  };
  following?: {
    id: string;
    name: string;
    profilePicture: string | null;
    bio: string | null;
  };
  createdAt: string;
}

export default function UserProfile() {
  const params = useParams();
  const router = useRouter();
  const { authenticated, userId: currentUserId } = useContext(AuthContext);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [followStatus, setFollowStatus] = useState<{
    isFollowing: boolean;
    isFollowedBy: boolean;
    isFriend: boolean;
    shouldFollowBack: boolean;
  } | null>(null);
  const [followLoading, setFollowLoading] = useState(false);
  
  // Followers/Following modal states
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followers, setFollowers] = useState<FollowerFollowing[]>([]);
  const [following, setFollowing] = useState<FollowerFollowing[]>([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [sortBy, setSortBy] = useState<"recent" | "name">("recent");

  useEffect(() => {
    if (params.id) {
      fetchUser();
      fetchPosts();
      if (authenticated && params.id !== currentUserId) {
        fetchFollowStatus();
      }
    }
  }, [params.id, authenticated, currentUserId]);

  const fetchUser = async () => {
    try {
      const response = await AxiosInstance.get(`/users/${params.id}`);
      setUser(response.data);
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await AxiosInstance.get(
        `/posts?authorId=${params.id}&published=true`
      );
      setPosts(response.data.posts || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowStatus = async () => {
    if (!authenticated || !params.id) return;
    try {
      const response = await AxiosInstance.get(`/users/${params.id}/follow-status`);
      setFollowStatus(response.data);
    } catch (error) {
      console.error("Error fetching follow status:", error);
    }
  };

  const fetchFollowers = async () => {
    if (!params.id) return;
    try {
      setLoadingFollowers(true);
      const response = await AxiosInstance.get(`/users/${params.id}/followers?sort=${sortBy}`);
      setFollowers(response.data || []);
    } catch (error) {
      console.error("Error fetching followers:", error);
      toast.error("Gagal mengambil daftar followers");
    } finally {
      setLoadingFollowers(false);
    }
  };

  const fetchFollowing = async () => {
    if (!params.id) return;
    try {
      setLoadingFollowing(true);
      const response = await AxiosInstance.get(`/users/${params.id}/following?sort=${sortBy}`);
      setFollowing(response.data || []);
    } catch (error) {
      console.error("Error fetching following:", error);
      toast.error("Gagal mengambil daftar following");
    } finally {
      setLoadingFollowing(false);
    }
  };

  useEffect(() => {
    if (showFollowersModal) {
      fetchFollowers();
    }
  }, [showFollowersModal, sortBy]);

  useEffect(() => {
    if (showFollowingModal) {
      fetchFollowing();
    }
  }, [showFollowingModal, sortBy]);

  const handleFollow = async () => {
    if (!authenticated) {
      toast.error("Harus login dulu untuk follow user");
      return;
    }

    if (!params.id) return;

    try {
      setFollowLoading(true);
      const isFollowing = followStatus?.isFollowing || false;

      if (isFollowing) {
        await AxiosInstance.delete(`/users/${params.id}/follow`);
        setFollowStatus((prev) =>
          prev
            ? {
                ...prev,
                isFollowing: false,
                isFriend: false,
              }
            : null
        );
        toast.success("Berhasil unfollow");
      } else {
        const response = await AxiosInstance.post(`/users/${params.id}/follow`);
        setFollowStatus((prev) =>
          prev
            ? {
                ...prev,
                isFollowing: true,
                isFriend: response.data.isFriend || false,
              }
            : null
        );
        if (response.data.isFriend) {
          toast.success("Berhasil follow! Sekarang kalian sudah berteman!");
        } else {
          toast.success("Berhasil follow");
        }
      }
      // Refresh user data to update counts
      fetchUser();
    } catch (error: any) {
      console.error("Error following user:", error);
      toast.error(error.response?.data?.msg || "Gagal follow/unfollow");
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24">
          <div className="flex items-center justify-center gap-3 py-16">
            <div className="relative">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
              <Sparkles className="h-4 w-4 text-primary absolute -top-1 -right-1 animate-pulse" />
            </div>
            <span className="text-lg font-medium text-foreground">Memuat profil...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 text-center">
          <p className="text-xl text-muted-foreground">User not found</p>
        </div>
      </div>
    );
  }

  const isOwnProfile = authenticated && params.id === currentUserId;
  const userToDisplay = showFollowersModal ? followers.map(f => f.follower).filter(Boolean) : 
                        showFollowingModal ? following.map(f => f.following).filter(Boolean) : [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {/* Custom CSS */}
      {user?.customCSS && (
        <style dangerouslySetInnerHTML={{ __html: user.customCSS }} />
      )}
      <main className="pt-20 pb-16" style={{ paddingTop: '5rem', paddingBottom: '4rem' }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          {/* Profile Header */}
          <div className="profile-container bg-card border border-border/50 rounded-xl p-6 md:p-8 mb-8 shadow-sm" style={{ marginTop: 0, marginBottom: '2rem' }}>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {user.profilePicture ? (
                <Image
                  src={user.profilePicture}
                  alt={user.name}
                  width={120}
                  height={120}
                  className="rounded-full w-24 h-24 md:w-30 md:h-30 object-cover"
                />
              ) : (
                <div className="w-24 h-24 md:w-30 md:h-30 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <User className="h-12 w-12 md:h-16 md:w-16 text-primary" />
                </div>
              )}
              <div className="flex-1 w-full text-center md:text-left">
                <div className="flex flex-col sm:flex-row items-center md:items-start justify-center md:justify-start gap-3 mb-3">
                  <h1 className="profile-name text-2xl md:text-3xl font-bold">{user.name}</h1>
                  <div className="flex items-center gap-2">
                    {isOwnProfile && (
                      <Link
                        href="/profile/edit"
                        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium text-sm flex items-center gap-2"
                      >
                        <Settings className="h-4 w-4" />
                        <span className="hidden sm:inline">Edit Profile</span>
                        <span className="sm:hidden">Edit</span>
                      </Link>
                    )}
                    {authenticated &&
                      params.id !== currentUserId &&
                      followStatus !== null && (
                        <>
                          <button
                            onClick={handleFollow}
                            disabled={followLoading}
                            className={`px-4 md:px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 text-sm ${
                              followStatus.isFollowing
                                ? "bg-muted text-foreground hover:bg-accent"
                                : "bg-primary text-primary-foreground hover:opacity-90"
                            }`}
                          >
                            {followLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : followStatus.isFriend ? (
                              "Friends"
                            ) : followStatus.shouldFollowBack ? (
                              "Follow Back"
                            ) : followStatus.isFollowing ? (
                              "Following"
                            ) : (
                              "Follow"
                            )}
                          </button>
                          <Link
                            href={`/messages?userId=${params.id}`}
                            className="px-4 md:px-6 py-2 rounded-lg font-medium transition-colors bg-primary text-primary-foreground hover:opacity-90 text-sm flex items-center gap-2"
                          >
                            <MessageSquare className="h-4 w-4" />
                            <span className="hidden sm:inline">Message</span>
                            <span className="sm:hidden">Chat</span>
                          </Link>
                        </>
                      )}
                  </div>
                </div>
                {user.bio && (
                  <p className="profile-bio text-muted-foreground mb-2 text-sm md:text-base">{user.bio}</p>
                )}
                {user.description && (
                  <p className="profile-description text-foreground mb-4 text-sm md:text-base leading-relaxed">{user.description}</p>
                )}
                {/* Custom Links */}
                {user.customLinks && user.customLinks.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {user.customLinks.map((link) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm"
                      >
                        <span>{link.label}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">
                      {user._count.posts}
                    </span>
                    <span>Posts</span>
                  </div>
                  <button
                    onClick={() => {
                      setShowFollowersModal(true);
                    }}
                    className="flex items-center gap-2 hover:text-foreground transition-colors cursor-pointer"
                  >
                    <span className="font-semibold text-foreground">
                      {user._count.followers}
                    </span>
                    <span>Followers</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowFollowingModal(true);
                    }}
                    className="flex items-center gap-2 hover:text-foreground transition-colors cursor-pointer"
                  >
                    <span className="font-semibold text-foreground">
                      {user._count.following}
                    </span>
                    <span>Following</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Posts */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Posts</h2>
            {posts.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-xl">
                <p className="text-muted-foreground">No posts yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/posts/${post.id}`}
                    className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary transition-all hover:shadow-lg"
                  >
                    {post.coverImage && (
                      <div className="relative w-full h-48 overflow-hidden">
                        <Image
                          src={post.coverImage}
                          alt={post.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-2 line-clamp-2 hover:text-primary transition-colors">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                          {post.excerpt}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{post.readingTime} min</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            <span>{post._count.claps}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4" />
                            <span>{post._count.comments}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Followers Modal */}
      {showFollowersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-border">
              <h2 className="text-xl md:text-2xl font-bold">Followers</h2>
              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "recent" | "name")}
                  className="px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="recent">Recent</option>
                  <option value="name">Name</option>
                </select>
                <button
                  onClick={() => setShowFollowersModal(false)}
                  className="p-2 rounded-lg hover:bg-accent transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              {loadingFollowers ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 text-primary animate-spin" />
                </div>
              ) : followers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No followers yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {followers.map((item) => {
                    const followerUser = item.follower;
                    if (!followerUser) return null;
                    return (
                      <Link
                        key={item.id}
                        href={`/users/${followerUser.id}`}
                        onClick={() => setShowFollowersModal(false)}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                      >
                        {followerUser.profilePicture ? (
                          <Image
                            src={followerUser.profilePicture}
                            alt={followerUser.name}
                            width={48}
                            height={48}
                            className="rounded-full w-12 h-12 object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                            <User className="h-6 w-6 text-primary" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{followerUser.name}</p>
                          {followerUser.bio && (
                            <p className="text-sm text-muted-foreground truncate">{followerUser.bio}</p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Following Modal */}
      {showFollowingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-border">
              <h2 className="text-xl md:text-2xl font-bold">Following</h2>
              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "recent" | "name")}
                  className="px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="recent">Recent</option>
                  <option value="name">Name</option>
                </select>
                <button
                  onClick={() => setShowFollowingModal(false)}
                  className="p-2 rounded-lg hover:bg-accent transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              {loadingFollowing ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 text-primary animate-spin" />
                </div>
              ) : following.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Not following anyone yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {following.map((item) => {
                    const followingUser = item.following;
                    if (!followingUser) return null;
                    return (
                      <Link
                        key={item.id}
                        href={`/users/${followingUser.id}`}
                        onClick={() => setShowFollowingModal(false)}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                      >
                        {followingUser.profilePicture ? (
                          <Image
                            src={followingUser.profilePicture}
                            alt={followingUser.name}
                            width={48}
                            height={48}
                            className="rounded-full w-12 h-12 object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                            <User className="h-6 w-6 text-primary" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{followingUser.name}</p>
                          {followingUser.bio && (
                            <p className="text-sm text-muted-foreground truncate">{followingUser.bio}</p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
