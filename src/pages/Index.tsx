import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import logo from "@/assets/timepass-logo.png";
import { Sparkles } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated gradient background */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20 animate-gradient-shift"
        style={{ backgroundSize: "200% 200%" }}
      />
      
      {/* Floating decoration circles */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      
      {/* Main content */}
      <Card className="relative w-full max-w-md p-10 space-y-8 backdrop-blur-xl bg-card/80 border-border/50 shadow-2xl animate-scale-in">
        {/* Logo and title */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="flex justify-center mb-2">
            <div className="relative">
              <img 
                src={logo} 
                alt="Timepass Logo" 
                className="w-24 h-24 object-contain drop-shadow-lg"
              />
              <div className="absolute -top-1 -right-1">
                <Sparkles className="w-6 h-6 text-primary animate-pulse" />
              </div>
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient-shift" style={{ backgroundSize: "200% auto" }}>
            Timepass
          </h1>
          <p className="text-lg text-muted-foreground">Share your moments, connect with friends</p>
        </div>
        
        {/* Auth buttons */}
        <div className="space-y-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <Button 
            className="w-full h-14 text-lg font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl bg-gradient-to-r from-primary to-accent" 
            size="lg"
          >
            Create Account
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or</span>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            className="w-full h-14 text-lg font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] border-2 hover:border-primary/50 hover:bg-primary/5" 
            size="lg"
          >
            Login
          </Button>
        </div>
        
        {/* Footer text */}
        <p className="text-center text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: "0.2s" }}>
          Join thousands sharing their beautiful moments
        </p>
      </Card>
    </div>
  );
};

export default Index;
