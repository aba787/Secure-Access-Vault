import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRegister, getGetMeQueryKey } from "@workspace/api-client-react";
import { useLocation, Link } from "wouter";
import { Shield, KeyRound, UserPlus } from "lucide-react";
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50, "Username must be less than 50 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["user", "admin"]).default("user"),
});

export default function Register() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      role: "user",
    },
  });

  const register = useRegister({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({ title: "Registration successful", description: `Welcome to the vault, ${data.user.username}` });
        
        if (data.user.role === "admin") {
          setLocation("/admin");
        } else {
          setLocation("/dashboard");
        }
      },
      onError: (error: any) => {
        toast({ 
          title: "Registration Failed", 
          description: error?.error || "Could not complete registration.",
          variant: "destructive"
        });
      },
    }
  });

  function onSubmit(values: z.infer<typeof registerSchema>) {
    register.mutate({ data: values });
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="w-full max-w-md z-10 transition-transform">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-card border border-border shadow-sm mb-4 relative">
            <UserPlus className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Request Access</h1>
          <p className="text-muted-foreground mt-2">Initialize a new secure connection profile</p>
        </div>

        <Card className="border-border/50 shadow-xl bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <CardHeader>
            <CardTitle>Registration</CardTitle>
            <CardDescription>
              Create your digital vault credentials.
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
                          disabled={register.isPending}
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
                            disabled={register.isPending}
                            className="bg-background/50 focus:bg-background transition-colors pr-10"
                          />
                          <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem className="space-y-3 pt-4 pb-2">
                      <FormLabel>Clearance Level</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                          disabled={register.isPending}
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-3 bg-background/50 hover:bg-background/80 transition-colors cursor-pointer">
                            <FormControl>
                              <RadioGroupItem value="user" />
                            </FormControl>
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4 text-muted-foreground" />
                              <FormLabel className="font-normal cursor-pointer">Standard User</FormLabel>
                            </div>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-3 bg-background/50 hover:bg-background/80 transition-colors cursor-pointer border-primary/20">
                            <FormControl>
                              <RadioGroupItem value="admin" />
                            </FormControl>
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4 text-primary" />
                              <FormLabel className="font-normal cursor-pointer text-primary">Administrator</FormLabel>
                            </div>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full mt-6" 
                  disabled={register.isPending}
                >
                  {register.isPending ? "Provisioning..." : "Initialize Profile"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-border/50 pt-6 pb-6">
            <div className="text-sm text-muted-foreground flex gap-1 items-center">
              <span>Already have clearance?</span>
              <Link href="/" className="text-primary hover:underline font-medium">
                Establish connection
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}