import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Leaf, User } from "lucide-react";
import { useUserStats } from "@/hooks/use-waste";

export function Header() {
  const { user, logout } = useAuth();
  const { data: stats } = useUserStats();

  if (!user) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          <div className="p-2 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
            <Leaf className="w-6 h-6 text-primary" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-foreground">
            WasteLens <span className="text-primary">AI</span>
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20">
            <span className="text-sm font-medium text-accent-foreground/80">Points</span>
            <span className="font-bold text-accent-foreground">{stats?.totalPoints || 0}</span>
          </div>

          <div className="flex items-center gap-3 pl-4 border-l">
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium leading-none">
                  {user.firstName || user.username || 'User'}
                </p>
                <p className="text-xs text-muted-foreground">Level {Math.floor((stats?.totalPoints || 0) / 100) + 1}</p>
              </div>
              <Avatar className="h-9 w-9 border-2 border-primary/10">
                <AvatarImage src={user.profileImageUrl || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {user.firstName?.[0] || user.username?.[0] || <User className="w-4 h-4" />}
                </AvatarFallback>
              </Avatar>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => logout()} 
              className="text-muted-foreground hover:text-destructive transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
