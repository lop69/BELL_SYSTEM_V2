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

const Header = () => {
  const { user, signOut, isGuest } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-10 flex h-16 items-center gap-4 border-b border-white/20 dark:border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-2xl px-4">
      <div className="flex-1">
        <h1 className="text-base font-semibold">Smart Bell Scheduler</h1>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full relative">
              <Bell className="h-5 w-5" />
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs">2</Badge>
              <span className="sr-only">Toggle notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <div className="flex flex-col">
                  <p className="font-semibold">Device Disconnected</p>
                  <p className="text-xs text-muted-foreground">ESP8266 lost connection 5 mins ago.</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="flex flex-col">
                  <p className="font-semibold">Schedule Updated</p>
                  <p className="text-xs text-muted-foreground">"2nd Year" schedule was modified.</p>
                </div>
              </DropdownMenuItem>
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
            <DropdownMenuLabel>{isGuest ? "Guest Mode" : user?.email}</DropdownMenuLabel>
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
    </header>
  );
};

export default Header;