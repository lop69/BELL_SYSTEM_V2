import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";

export interface Notification {
  id: number;
  title: string;
  message: string;
  read: boolean;
  timestamp: Date;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;

    const handleDbChange = (payload: any, table: string) => {
      let title = "System Update";
      let message = `An item in ${table} was updated.`;
      const tableName = table.slice(0, -1);

      if (payload.eventType === 'INSERT') {
        title = `${tableName} Created`;
        message = `A new ${tableName} was added.`;
      } else if (payload.eventType === 'UPDATE') {
        title = `${tableName} Updated`;
        message = `A ${tableName} was modified.`;
      } else if (payload.eventType === 'DELETE') {
        title = `${tableName} Deleted`;
        message = `A ${tableName} was removed.`;
      }

      const newNotification: Notification = {
        id: Date.now(),
        title,
        message,
        read: false,
        timestamp: new Date(),
      };

      setNotifications(prev => [newNotification, ...prev].slice(0, 10)); // Keep last 10
    };

    const schedulesChannel = supabase
      .channel('public:schedules')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, (payload) => handleDbChange(payload, 'schedules'))
      .subscribe();

    const bellsChannel = supabase
      .channel('public:bells')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bells' }, (payload) => handleDbChange(payload, 'bells'))
      .subscribe();

    return () => {
      supabase.removeChannel(schedulesChannel);
      supabase.removeChannel(bellsChannel);
    };
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const value = { notifications, unreadCount, markAllAsRead };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};