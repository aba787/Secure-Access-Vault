import { useAdminGetStats, useAdminListUsers, useAdminUnlockUser, useAdminGetLogs, getAdminGetStatsQueryKey, getAdminListUsersQueryKey, getAdminGetLogsQueryKey } from "@workspace/api-client-react";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Lock, 
  Unlock, 
  ShieldAlert, 
  UserX, 
  Activity, 
  RefreshCcw, 
  ShieldCheck, 
  AlertCircle,
  LogIn,
  LogOut,
  UserPlus
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: stats, isLoading: isLoadingStats } = useAdminGetStats({
    query: { queryKey: getAdminGetStatsQueryKey() }
  });

  const { data: users, isLoading: isLoadingUsers } = useAdminListUsers({
    query: { queryKey: getAdminListUsersQueryKey() }
  });

  const { data: logs, isLoading: isLoadingLogs } = useAdminGetLogs(
    { limit: 20 },
    { query: { queryKey: getAdminGetLogsQueryKey({ limit: 20 }) } }
  );

  const unlockUser = useAdminUnlockUser({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getAdminGetStatsQueryKey() });
        toast({ title: "Account unlocked successfully" });
      },
      onError: (error: any) => {
        toast({ 
          title: "Failed to unlock account", 
          description: error?.error || "Unknown error occurred",
          variant: "destructive"
        });
      }
    }
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getAdminGetStatsQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getAdminGetLogsQueryKey({ limit: 20 }) })
    ]);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'login': return <LogIn className="w-4 h-4 text-green-500" />;
      case 'login_failed': return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'account_locked': return <Lock className="w-4 h-4 text-destructive" />;
      case 'logout': return <LogOut className="w-4 h-4 text-muted-foreground" />;
      case 'register': return <UserPlus className="w-4 h-4 text-blue-500" />;
      default: return <Activity className="w-4 h-4 text-primary" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'login': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'login_failed': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'account_locked': return 'text-destructive bg-destructive/10 border-destructive/20';
      case 'logout': return 'text-muted-foreground bg-muted border-border';
      case 'register': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      default: return 'text-primary bg-primary/10 border-primary/20';
    }
  };

  return (
    <AuthLayout requireAuth requireAdmin>
      <div className="container mx-auto p-4 md:p-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-6 border-b border-border/50 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-2">
              <ShieldAlert className="w-8 h-8 text-primary" />
              Control Panel
            </h1>
            <p className="text-muted-foreground">System overview, access management, and audit logs.</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="p-3 bg-primary/10 text-primary rounded-full mb-4">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Users</p>
              <h2 className="text-3xl font-bold tracking-tight">
                {isLoadingStats ? <Skeleton className="h-9 w-16 mx-auto" /> : stats?.totalUsers}
              </h2>
            </CardContent>
          </Card>
          
          <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="p-3 bg-destructive/10 text-destructive rounded-full mb-4">
                <UserX className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Locked Accounts</p>
              <h2 className="text-3xl font-bold tracking-tight">
                {isLoadingStats ? <Skeleton className="h-9 w-16 mx-auto" /> : stats?.lockedAccounts}
              </h2>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="p-3 bg-blue-500/10 text-blue-500 rounded-full mb-4">
                <Activity className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Logins</p>
              <h2 className="text-3xl font-bold tracking-tight">
                {isLoadingStats ? <Skeleton className="h-9 w-16 mx-auto" /> : stats?.totalLoginAttempts}
              </h2>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-full mb-4">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Failed Logins</p>
              <h2 className="text-3xl font-bold tracking-tight">
                {isLoadingStats ? <Skeleton className="h-9 w-16 mx-auto" /> : stats?.failedLoginAttempts}
              </h2>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* User Management */}
          <Card className="lg:col-span-2 border-border/50 shadow-sm bg-card/50 backdrop-blur">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Access Management
              </CardTitle>
              <CardDescription>View and manage user accounts</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Username</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Failed Attempts</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingUsers ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : users?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No users found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      users?.map((user) => (
                        <TableRow key={user.id} className="transition-colors hover:bg-muted/50 group">
                          <TableCell className="font-medium font-mono">{user.username}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`capitalize ${user.role === 'admin' ? 'bg-primary/10 text-primary border-primary/20' : ''}`}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.isLocked ? (
                              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 gap-1">
                                <Lock className="w-3 h-3" /> Locked
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 gap-1">
                                <ShieldCheck className="w-3 h-3" /> Active
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className={`font-mono ${user.failedAttempts > 0 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                              {user.failedAttempts}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              disabled={!user.isLocked || unlockUser.isPending}
                              onClick={() => unlockUser.mutate({ id: user.id })}
                              className={`gap-2 ${user.isLocked ? 'hover:bg-green-500/10 hover:text-green-500 hover:border-green-500/50' : 'opacity-50'}`}
                            >
                              <Unlock className="w-4 h-4" />
                              Unlock
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Audit Logs */}
          <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur flex flex-col h-[600px]">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Audit Log
              </CardTitle>
              <CardDescription>Recent system activity</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              <div className="divide-y divide-border/50">
                {isLoadingLogs ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="p-4 space-y-2">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <Skeleton className="h-3 w-32" />
                    </div>
                  ))
                ) : logs?.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No activity recorded.
                  </div>
                ) : (
                  logs?.map((log, i) => (
                    <div 
                      key={log.id} 
                      className="p-4 hover:bg-muted/30 transition-colors animate-in fade-in slide-in-from-right-4"
                      style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {getActionIcon(log.action)}
                          <span className="font-medium text-sm capitalize">
                            {log.action.replace('_', ' ')}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {format(new Date(log.createdAt), "HH:mm:ss")}
                        </span>
                      </div>
                      <div className="text-sm mt-2 flex flex-col gap-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">User:</span>
                          <span className="font-mono">{log.username || 'System'}</span>
                        </div>
                        {log.ipAddress && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">IP:</span>
                            <span className="font-mono">{log.ipAddress}</span>
                          </div>
                        )}
                        {log.details && (
                          <div className="text-xs text-muted-foreground bg-background/50 p-2 rounded mt-1 border border-border/50">
                            {log.details}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthLayout>
  );
}