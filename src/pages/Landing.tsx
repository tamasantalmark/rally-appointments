import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "Automated appointment booking that syncs with your availability"
    },
    {
      icon: Clock,
      title: "Time Zone Support",
      description: "Automatically handles bookings across different time zones"
    },
    {
      icon: Users,
      title: "Multi-Tenant Ready",
      description: "Perfect for businesses managing multiple clients or locations"
    },
    {
      icon: Sparkles,
      title: "Easy Integration",
      description: "Embed booking widgets directly into your website"
    }
  ];

  const benefits = [
    "No-code setup in minutes",
    "Unlimited appointments",
    "Email notifications",
    "Mobile responsive",
    "Secure and reliable",
    "Custom branding options"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">BookEase</span>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
            <Button onClick={() => navigate("/auth")}>
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            Multi-tenant appointment platform
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary-glow bg-clip-text text-transparent leading-tight">
            Appointment Booking Made Simple
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            The easiest way to manage appointments for your business. Let your clients book directly through your website with zero hassle.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-8 shadow-glow">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/book/demo")}>
              View Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need to manage bookings
            </h2>
            <p className="text-muted-foreground text-lg">
              Powerful features designed for modern businesses
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="p-6 rounded-xl bg-card border border-border shadow-card hover:shadow-glow transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Why businesses choose BookEase
              </h2>
              <p className="text-muted-foreground mb-8">
                Join thousands of businesses that trust BookEase for their appointment scheduling needs.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 via-accent/20 to-primary-glow/20 p-8 backdrop-blur">
                <div className="h-full rounded-xl bg-card/50 border border-border flex items-center justify-center">
                  <Calendar className="h-32 w-32 text-primary/40" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 mb-20">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-primary via-accent to-primary-glow rounded-2xl p-12 text-center text-primary-foreground">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to streamline your bookings?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Start your free trial today. No credit card required.
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => navigate("/auth")}
            className="text-lg px-8"
          >
            Get Started Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Landing;