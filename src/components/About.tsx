
import { Card, CardContent } from "@/components/ui/card";

const About = () => {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Building <span className="text-infra-blue-600">Resilient</span> Infrastructure
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              InfraBharat is India's first comprehensive AI-driven platform for urban water management. 
              We combine cutting-edge technology with environmental science to create sustainable solutions 
              for drainage and flood management.
            </p>
            <p className="text-lg text-gray-600 mb-8">
              Our platform empowers both citizens and government officials with real-time data, 
              predictive analytics, and actionable insights to prevent water logging and build 
              climate-resilient cities.
            </p>

            <div className="grid grid-cols-2 gap-6">
              <Card className="border-infra-green-200 bg-infra-green-50">
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-infra-green-600 mb-2">24/7</div>
                  <div className="text-sm text-gray-600">Monitoring</div>
                </CardContent>
              </Card>
              <Card className="border-infra-blue-200 bg-infra-blue-50">
                <CardContent className="p-6 text-center">
                  <div className="text-2xl font-bold text-infra-blue-600 mb-2">AI-Driven</div>
                  <div className="text-sm text-gray-600">Predictions</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Visual */}
          <div className="relative animate-fade-in">
            <div className="bg-gradient-to-br from-infra-green-100 to-infra-blue-100 rounded-2xl p-8 h-96 flex items-center justify-center">
              <div className="text-center">
                <div className="text-8xl mb-4">🏙️</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Smart City Vision</h3>
                <p className="text-gray-600">Sustainable • Resilient • Connected</p>
              </div>
            </div>
            
            {/* Floating cards */}
            <Card className="absolute -top-4 -left-4 bg-white shadow-lg border-0">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">💧</span>
                  <div>
                    <div className="font-semibold text-sm">Water Management</div>
                    <div className="text-xs text-gray-500">Real-time monitoring</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="absolute -bottom-4 -right-4 bg-white shadow-lg border-0">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🌱</span>
                  <div>
                    <div className="font-semibold text-sm">Green Solutions</div>
                    <div className="text-xs text-gray-500">Eco-friendly approach</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
