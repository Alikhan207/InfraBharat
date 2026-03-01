
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Features = () => {
  const features = [
    {
      title: "AI-Powered Drainage Analysis",
      description: "Advanced algorithms analyze drainage systems to predict and prevent water logging issues",
      icon: "🧠",
      badge: "AI Core"
    },
    {
      title: "Real-time Monitoring",
      description: "24/7 monitoring of water levels, drainage capacity, and weather conditions",
      icon: "📊",
      badge: "Live Data"
    },
    {
      title: "Smart Route Planning",
      description: "Dynamic route recommendations during flooding to keep citizens safe",
      icon: "🗺️",
      badge: "Navigation"
    },
    {
      title: "Citizen Complaints",
      description: "Easy-to-use platform for reporting drainage issues and tracking resolution",
      icon: "📱",
      badge: "Community"
    },
    {
      title: "Cost Estimation",
      description: "Accurate cost calculations for drainage improvements and tree plantation",
      icon: "💰",
      badge: "Planning"
    },
    {
      title: "Environmental Solutions",
      description: "Tree plantation recommendations for natural water absorption and soil improvement",
      icon: "🌳",
      badge: "Green Tech"
    }
  ];

  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Innovative Features for <span className="text-infra-green-600">Smart Cities</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive solutions that combine artificial intelligence, environmental science, 
            and citizen engagement to tackle urban water management challenges.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="hover:shadow-lg transition-all duration-300 hover:-translate-y-2 border-0 shadow-md"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-4xl">{feature.icon}</span>
                  <Badge variant="secondary" className="bg-infra-green-100 text-infra-green-700">
                    {feature.badge}
                  </Badge>
                </div>
                <CardTitle className="text-xl text-gray-900">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
