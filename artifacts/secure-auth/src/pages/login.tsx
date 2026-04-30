import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin, getGetMeQueryKey } from "@workspace/api-client-react";
import { useLocation, Link } from "wouter";
import { Shield, Lock, Unlock, AlertTriangle, KeyRound } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [shake, setShake] = useState(false);
  const [lockedOut, setLockedOut] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  useEffect(() => {
    if (shake) {
      const timer = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(timer);
    }
  }, [shake]);

  const login = useLogin({
    mutation: {
      onSuccess: (data) => {
        // Invalidate the auth query
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({ title: "Authentication successful", description: `Welcome back, ${data.user.username}` });
        
        // Redirect based on role
        if (data.user.role === "admin") {
          setLocation("/admin");
        } else {
          setLocation("/dashboard");
        }
      },
      onError: (error: any) => {
        setShake(true);
        // The error might contain specific locked/attempts remaining info
        const errorData = error;
        
        if (errorData?.locked) {
          setLockedOut(true);
          toast({ 
            title: "Account Locked", 
            description: errorData.error || "Too many failed attempts. Please contact an administrator.",
            variant: "destructive"
          });
        } else {
          if (errorData?.attemptsRemaining !== undefined) {
            setAttemptsRemaining(errorData.attemptsRemaining);
          }
          
          toast({ 
            title: "Authentication Failed", 
            description: errorData?.error || "Invalid username or password.",
            variant: "destructive"
          });
        }
      },
    }
  });

  function onSubmit(values: z.infer<typeof loginSchema>) {
    login.mutate({ data: values });
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div 
        ref={formRef}
        className={`w-full max-w-md z-10 transition-transform ${shake ? 'animate-shake' : ''}`}
        style={shake ? { animation: 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both' } : {}}
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-card border border-border shadow-sm mb-4 relative">
            {lockedOut ? (
              <Lock className="w-8 h-8 text-destructive animate-pulse" />
            ) : (
              <Unlock className="w-8 h-8 text-primary" />
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Secure Vault</h1>
          <p className="text-muted-foreground mt-2">Enter your credentials to access your account</p>
        </div>

        {lockedOut && (
          <Alert variant="destructive" className="mb-6 border-destructive/50 bg-destructive/10">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Account Locked</AlertTitle>
            <AlertDescription>
              Due to multiple failed login attempts, this account has been secured. Please contact a system administrator to unlock it.
            </AlertDescription>
          </Alert>
        )}

        {!lockedOut && attemptsRemaining !== null && (
          <Alert variant="default" className="mb-6 border-amber-500/50 bg-amber-500/10 text-amber-500">
            <AlertTriangle className="h-4 w-4 !text-amber-500" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              {attemptsRemaining} login attempts remaining before account lockout.
            </AlertDescription>
          </Alert>
        )}

        <Card className="border-border/50 shadow-xl bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
            <CardDescription>
              All access attempts are logged and monitored.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="johndoe" 
                          {...field} 
                          disabled={login.isPending || lockedOut}
                          className="bg-background/50 focus:bg-background transition-colors"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Passphrase</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type="password" 
                            placeholder="••••••••" 
                            {...field} 
                            disabled={login.isPending || lockedOut}
                            className="bg-background/50 focus:bg-background transition-colors pr-10"
                          />
                          <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full mt-6" 
                  disabled={login.isPending || lockedOut}
                >
                  {login.isPending ? "Authenticating..." : "Establish Connection"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-border/50 pt-6 pb-6">
            <div className="text-sm text-muted-foreground flex gap-1 items-center">
              <span>Unregistered personnel?</span>
              <Link href="/register" className="text-primary hover:underline font-medium">
                Request access
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
        .animate-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}} />
    </div>
  );
}