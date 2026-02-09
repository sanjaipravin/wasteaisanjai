import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Leaf, Recycle, Trash2 } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Left Content */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-[#E8F5E9] dark:bg-[#052e16] p-8 lg:p-12 xl:p-24 justify-center">
        {/* Abstract Background Shapes */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent/10 blur-3xl" />
        
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-primary rounded-2xl shadow-lg shadow-primary/20">
              <Leaf className="w-8 h-8 text-white" />
            </div>
            <span className="text-2xl font-bold font-display tracking-tight">WasteLens AI</span>
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-display font-bold text-foreground mb-6 leading-[1.1]">
            Waste Sorting, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-400">Reimagined.</span>
          </h1>
          
          <p className="text-lg lg:text-xl text-muted-foreground mb-10 leading-relaxed max-w-lg">
            Join the smart city revolution. Instantly identify waste categories using AI, earn rewards, and contribute to a cleaner planet.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            {[
              { icon: Leaf, label: "Wet Waste", color: "text-green-600" },
              { icon: Recycle, label: "Recyclables", color: "text-blue-600" },
              { icon: Trash2, label: "Dry Waste", color: "text-amber-600" },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center p-4 bg-white/60 dark:bg-black/20 backdrop-blur rounded-xl border border-white/40 shadow-sm">
                <item.icon className={`w-8 h-8 mb-2 ${item.color}`} />
                <span className="font-semibold text-sm">{item.label}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-gray-200" />
              ))}
            </div>
            <span>Trusted by 10,000+ eco-warriors</span>
          </div>
        </div>
      </div>

      {/* Right Content - Login */}
      <div className="w-full lg:w-[45%] bg-background flex flex-col p-8 lg:p-12 justify-center border-l border-border/50">
        <div className="max-w-md w-full mx-auto space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold font-display mb-2">Welcome Back</h2>
            <p className="text-muted-foreground">Sign in to start scanning and earning points.</p>
          </div>

          <div className="space-y-4">
            <Button 
              asChild 
              size="lg" 
              className="w-full h-14 text-base font-semibold shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
            >
              <a href="/api/login">
                Get Started with Replit Auth
                <ArrowRight className="w-5 h-5 ml-2" />
              </a>
            </Button>
            
            <p className="text-xs text-center text-muted-foreground mt-6">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
