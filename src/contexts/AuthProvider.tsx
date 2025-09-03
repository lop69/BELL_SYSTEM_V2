import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Profile {
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  role: string | null;
  department: string | null;
  push_notifications_enabled: boolean | null;
  email_summary_enabled: boolean | null;
}

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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

          const { data: profileData } = await supabase
            .from("profiles")
            .select("first_name, last_name, phone_number, role, department, push_notifications_enabled, email_summary_enabled")
            .eq("id", currentUser.id)
            .single();
          
          setProfile(profileData ? {
            first_name: profileData.first_name,
            last_name: profileData.last_name,
            phone_number: profileData.phone_number,
            role: profileData.role || 'Student',
            department: profileData.department || 'General',
            push_notifications_enabled: profileData.push_notifications_enabled,
            email_summary_enabled: profileData.email_summary_enabled,
          } : null);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const updateProfile = async (newProfileData: Partial<Profile>) => {
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("profiles")
      .update(newProfileData)
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (data) {
      setProfile(data);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const value = {
    session,
    user,
    loading,
    profile,
    role: profile?.role || null,
    department: profile?.department || null,
    signOut,
    updateProfile,
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