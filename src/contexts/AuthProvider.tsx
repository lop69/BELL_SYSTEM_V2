import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Profile } from "@/types/database";
import { fetchProfile, updateProfile as apiUpdateProfile } from "@/api/profile";
import { showError, showSuccess } from "@/utils/toast";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => void;
  updateProfile: (newProfile: Partial<Profile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const { data: profile, isLoading: profileLoading, isRefetching } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user,
    // Poll for the profile for up to 5 seconds to handle the race condition
    // where the app loads faster than the database trigger can create the profile.
    refetchInterval: (query) => {
      if (query.state.status === 'success' && query.state.data === null && Date.now() - query.state.dataUpdatedAt < 5000) {
        return 1000; // Poll every 1 second
      }
      return false; // Stop polling
    },
  });

  const profileMutation = useMutation({
    mutationFn: (newProfileData: Partial<Profile>) => apiUpdateProfile(user!.id, newProfileData),
    onSuccess: (data) => {
      queryClient.setQueryData(['profile', user?.id], data);
      showSuccess("Profile updated successfully!");
    },
    onError: () => {
      showError("Failed to update profile.");
    }
  });

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
  };

  // Keep the app in a loading state during auth, initial profile fetch, and while polling for the profile.
  const isPollingForProfile = profile === null && isRefetching;
  const isLoading = authLoading || (!!user && profileLoading) || (!!user && isPollingForProfile);

  const value = {
    user,
    session,
    profile: profile ?? null,
    loading: isLoading,
    signOut,
    updateProfile: profileMutation.mutate,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};