import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Profile } from "@/types/database";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: Profile | null;
  role: string | null;
  department: string | null;
  signOut: () => void;
  updateProfile: (newProfile: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const fetchProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, phone_number, role, department, push_notifications_enabled, email_summary_enabled")
    .eq("id", userId)
    .single();
  if (error) throw new Error(error.message);
  return data;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  const { data: profile } = useQuery<Profile | null>({
    queryKey: ['profile', user?.id],
    queryFn: () => fetchProfile(user!.id),
    enabled: !!user,
  });

  const profileMutation = useMutation({
    mutationFn: async (newProfileData: Partial<Profile>) => {
      if (!user) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .from("profiles")
        .update(newProfileData)
        .eq("id", user.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['profile', user?.id], data);
    },
  });

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setLoading(true);
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          if (event === 'SIGNED_IN') {
            const storedRole = localStorage.getItem('signUpRole');
            const storedDepartment = localStorage.getItem('signUpDepartment');

            if (storedRole && storedDepartment) {
              await supabase
                .from('profiles')
                .update({ role: storedRole, department: storedDepartment })
                .eq('id', currentUser.id);
              
              localStorage.removeItem('signUpRole');
              localStorage.removeItem('signUpDepartment');
            }
          }
        }
        
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
  };

  const value = {
    session,
    user,
    loading,
    profile: profile ?? null,
    role: profile?.role || null,
    department: profile?.department || null,
    signOut,
    updateProfile: profileMutation.mutateAsync,
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