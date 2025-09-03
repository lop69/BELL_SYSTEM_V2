import { Bell, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";
import { useAuth } from "@/contexts/AuthProvider";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/contexts/NotificationProvider";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAllAsRead } = useNotifications();

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
      className="absolute top-0 left-0 right-0 z-20 flex h-16 items-center gap-4 glass-surface border-b px-4"
    >
      <div className="flex-1">
        <h1 className="text-base font-semibold">Smart Bell Scheduler</h1>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        <DropdownMenu onOpenChange={(open) => open && markAllAsRead()}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs">
                  {unreadCount}
                </Badge>
              )}
              <span className="sr-only">Toggle notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <DropdownMenuItem key={notif.id} className="flex flex-col items-start gap-1">
                    <div className="flex justify-between w-full">
                      <p className="font-semibold">{notif.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(notif.timestamp, { addSuffix: true })}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">{notif.message}</p>
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No new notifications.
                </div>
              )}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <User className="h-5 w-5" />
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/app/settings')}>Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/app/support')}>Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-red-500">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  );
};

export default Header;