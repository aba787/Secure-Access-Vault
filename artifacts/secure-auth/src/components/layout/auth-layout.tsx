import { ReactNode } from "react";
import { useGetMe, useLogout, getGetMeQueryKey } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { LogOut, Shield, User as UserIcon, LayoutDashboard, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export function AuthLayout({ children, requireAuth = true, requireAdmin = false }: { children: ReactNode, requireAuth?: boolean, requireAdmin?: boolean }) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user, isLoading, isError } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      retry: false,
    }
  });

  const logout = useLogout({
    mutation: {
      onSuccess: () => {
        queryClient.setQueryData(getGetMeQueryKey(), null);
        setLocation("/");
        toast({ title: "Logged out successfully" });
      }
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Shield className="w-12 h-12 text-primary animate-pulse" />
          <div className="flex flex-col gap-2 w-48">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  const isAuthed = !!user && !isError;
  const isAdmin = user?.role === "admin";

  if (requireAuth && !isAuthed) {
    setLocation("/");
    return null;
  }

  if (requireAdmin && !isAdmin) {
    setLocation("/dashboard");
    return null;
  }

  if (!requireAuth && isAuthed) {
    // If we're on login/register but already authed, redirect
    setLocation(isAdmin ? "/admin" : "/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {isAuthed && (
        <header className="border-b border-border/50 bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 sticky top-0 z-50">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary">
              <Shield className="w-6 h-6" />
              <span className="font-bold tracking-tight">VAULT</span>
            </div>

            <nav className="flex items-center gap-4">
              {isAdmin && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/admin" className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" />
                    <span className="hidden sm:inline">Admin Panel</span>
                  </Link>
                </Button>
              )}
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard" className="flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
              </Button>
              <div className="h-6 w-px bg-border mx-2" />
              <div className="flex items-center gap-3 text-sm text-muted-foreground mr-2">
                <UserIcon className="w-4 h-4" />
                <span className="hidden sm:inline">{user.username}</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </nav>
          </div>
        </header>
      )}
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}
