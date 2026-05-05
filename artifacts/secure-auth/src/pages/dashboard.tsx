import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, User as UserIcon, Calendar, Key, AlertTriangle, Fingerprint, Activity, FileText, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

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

        {/* Vault Services */}
        <div className="mt-6">
          <Card className="border-border/50 shadow-md bg-card/50 backdrop-blur">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Secure Vault Services
              </CardTitle>
              <CardDescription>Access your encrypted personal data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Link href="/notes" className="group flex flex-col justify-between p-4 rounded-xl border border-border/50 bg-background/50 hover:bg-background/80 hover:border-primary/30 transition-all cursor-pointer h-full">
                  <div className="mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">Encrypted Notes</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">Securely store and manage your personal notes with end-to-end AES-256 encryption.</p>
                  </div>
                  <div className="flex items-center text-primary text-sm font-medium mt-auto">
                    Access Vault <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthLayout>
  );
}