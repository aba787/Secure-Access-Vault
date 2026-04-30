import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, User as UserIcon, Calendar, Key, AlertTriangle, Fingerprint, Activity } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: user, isLoading } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey()
    }
  });

  return (
    <AuthLayout requireAuth>
      <div className="container mx-auto p-4 md:p-8 max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-8 border-b border-border/50 pb-6">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Security Dashboard</h1>
          <p className="text-muted-foreground">Manage your secure identity and session details.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Identity Card */}
          <Card className="border-border/50 shadow-md bg-card/50 backdrop-blur">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Fingerprint className="w-5 h-5 text-primary" />
                Identity Profile
              </CardTitle>
              <CardDescription>Verified system credentials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  <div className="h-10 bg-muted/50 animate-pulse rounded-md" />
                  <div className="h-10 bg-muted/50 animate-pulse rounded-md" />
                  <div className="h-10 bg-muted/50 animate-pulse rounded-md" />
                </div>
              ) : user ? (
                <div className="grid gap-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50">
                    <div className="flex items-center gap-3">
                      <UserIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Username</span>
                    </div>
                    <span className="font-mono text-sm">{user.username}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50">
                    <div className="flex items-center gap-3">
                      <Shield className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Clearance Level</span>
                    </div>
                    <span className="capitalize font-medium text-sm px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {user.role}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Profile Created</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(user.createdAt), "MMM d, yyyy HH:mm")}
                    </span>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Session Card */}
          <Card className="border-border/50 shadow-md bg-card/50 backdrop-blur">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Active Session
              </CardTitle>
              <CardDescription>Current connection status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-medium">Status</span>
                </div>
                <span className="text-sm font-medium text-green-500">Secure</span>
              </div>
              
              <Alert variant="default" className="border-primary/20 bg-primary/5 mt-4">
                <Key className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary">End-to-End Encrypted</AlertTitle>
                <AlertDescription className="text-muted-foreground text-xs mt-2">
                  Your session is authenticated and protected. Do not share your access credentials with unauthorized personnel.
                </AlertDescription>
              </Alert>

              {user?.role === 'admin' && (
                <Alert variant="default" className="border-amber-500/20 bg-amber-500/5 mt-4">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <AlertTitle className="text-amber-500">Administrator Access</AlertTitle>
                  <AlertDescription className="text-muted-foreground text-xs mt-2">
                    You have elevated privileges. Use the Admin Panel to manage system access and review security logs.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthLayout>
  );
}