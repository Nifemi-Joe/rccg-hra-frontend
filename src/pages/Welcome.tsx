import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserPlus, MessageCircle, Clock, ArrowRight, Sparkles, LogIn, UserCog } from "lucide-react";
import logo from "@/assets/hralogo.png";

const features = [
  {
    icon: UserPlus,
    title: "Member Management",
    description: "Keep accurate records and build stronger relationships with your congregation.",
    gradient: "from-primary to-secondary",
  },
  {
    icon: MessageCircle,
    title: "Smart Communication",
    description: "Engage your members with automated SMS, emails, and personalized messages.",
    gradient: "from-secondary to-primary",
  },
  {
    icon: Clock,
    title: "First-Timer Follow-up",
    description: "Never miss an opportunity to connect with visitors through automated workflows.",
    gradient: "from-primary via-secondary to-primary",
  },
];

export default function Welcome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary-light/20 to-background">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="ChurchPlus" className="h-10 w-10" />
            <span className="text-xl font-display font-bold text-foreground">He Reigns Assembly</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="outline" className="gap-2">
                <LogIn className="h-4 w-4" />
                Login
              </Button>
            </Link>
            <Link to="/register">
              <Button className="gap-2">
                <UserCog className="h-4 w-4" />
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="flex flex-col items-center text-center mb-16 animate-fade-in">
          <div className="mb-6 relative">
            <div className="absolute inset-0 bg-gradient-primary blur-2xl opacity-20 rounded-full" />
            <img src={logo} alt="ChurchPlus" className="h-20 w-20 relative z-10" />
          </div>
          
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-light px-4 py-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Welcome to He Reigns Assembly</span>
          </div>
          
          <h1 className="mb-4 text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-foreground tracking-tight">
            Manage Your Church
            <br />
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              With Confidence
            </span>
          </h1>
          
          <p className="max-w-2xl text-lg text-muted-foreground mb-8">
            The complete solution for church administration, member engagement, and growth tracking.
            Everything you need in one powerful platform.
          </p>

          {/*<div className="flex flex-col sm:flex-row gap-4">*/}
          {/*  <Link to="/register">*/}
          {/*    <Button size="lg" className="gap-2 px-8">*/}
          {/*      Sign up*/}
          {/*      <ArrowRight className="h-4 w-4" />*/}
          {/*    </Button>*/}
          {/*  </Link>*/}
          {/*  <Link to="/login">*/}
          {/*    <Button size="lg" variant="outline" className="gap-2 px-8">*/}
          {/*      Sign In to Your Account*/}
          {/*    </Button>*/}
          {/*  </Link>*/}
          {/*</div>*/}
        </div>

        {/* Feature Cards */}
        <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              className="group relative overflow-hidden border-2 hover:border-primary transition-all duration-500 hover:shadow-xl hover-lift animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="block p-8">
                <div className="relative z-10">
                  <div className={`mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} shadow-lg`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  
                  <h3 className="mb-3 text-xl font-display font-bold text-foreground group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
                
                {/* Animated background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
              </div>
            </Card>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-20 grid gap-8 sm:grid-cols-3 max-w-4xl mx-auto">
          {[
            { label: "Churches Served", value: "1,200+", icon: "🏛️" },
            { label: "Members Managed", value: "50k+", icon: "👥" },
            { label: "Messages Sent", value: "2M+", icon: "💬" },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-6 rounded-2xl bg-card border border-border hover:shadow-lg transition-all">
              <div className="text-4xl mb-2">{stat.icon}</div>
              <div className="text-3xl font-display font-bold text-foreground mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
