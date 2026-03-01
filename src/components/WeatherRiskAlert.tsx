import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CloudRain, AlertTriangle, RefreshCw, Droplets } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WeatherData {
  current: {
    temperature: number;
    precipitation: number;
    humidity: number;
  };
  forecast: {
    next_3_days_rainfall: number;
    max_probability: number;
  };
  waterlogging_risk: {
    score: number;
    level: "low" | "medium" | "high";
    message: string;
  };
  high_risk_zones: Array<{
    id: string;
    name: string;
    flood_risk_score: number;
  }>;
  preventive_recommendations: Array<{
    zone_id: string;
    zone_name: string;
    recommendation: string;
  }>;
}

export function WeatherRiskAlert() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchWeather = async () => {
    setLoading(true);
    try {
      // Fetch Real Weather from Open-Meteo (Free, No Key)
      // Bangalore Coordinates: 12.9716, 77.5946
      const response = await fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=12.9716&longitude=77.5946&current=temperature_2m,relative_humidity_2m,precipitation&daily=precipitation_sum,precipitation_probability_max&timezone=auto&forecast_days=3"
      );

      if (!response.ok) throw new Error("Failed to fetch weather data");

      const data = await response.json();

      // Parse Data
      const currentTemp = data.current.temperature_2m;
      const currentHumidity = data.current.relative_humidity_2m;
      const currentPrecipitation = data.current.precipitation;

      const dailyPrecipitation = data.daily.precipitation_sum; // Array of 3 days
      const totalRain3Days = dailyPrecipitation.reduce((a: number, b: number) => a + b, 0);
      const maxRainProb = Math.max(...data.daily.precipitation_probability_max);

      // Determine Risk Level dynamically
      let riskLevel: "low" | "medium" | "high" = "low";
      let riskMessage = "Weather conditions are stable. Low risk of waterlogging.";
      let riskScore = 0.2;

      if (currentPrecipitation > 5.0 || totalRain3Days > 50.0) {
        riskLevel = "high";
        riskMessage = "CRITICAL: High intensity rainfall detected. Imminent waterlogging risk in low-lying areas.";
        riskScore = 0.9;
      } else if (currentPrecipitation > 1.0 || totalRain3Days > 20.0) {
        riskLevel = "medium";
        riskMessage = "Moderate rainfall alert. Monitor drains in sensitive zones.";
        riskScore = 0.6;
      }

      // Mock High Risk Zones based on weather (Using static zones for context, but selecting based on risk)
      const mockZones = [
        { id: "4", name: "Zone 4 (MG Road)", flood_risk_score: 0.85 },
        { id: "2", name: "Zone 2 (Koramangala)", flood_risk_score: 0.78 },
        { id: "1", name: "Zone 1 (Indiranagar)", flood_risk_score: 0.2 },
      ];

      const highRiskZones = riskLevel === "high"
        ? mockZones.filter(z => z.flood_risk_score > 0.5)
        : riskLevel === "medium"
          ? mockZones.filter(z => z.flood_risk_score > 0.7)
          : [];

      // Recommendations
      const recommendations = [];
      if (riskLevel === "high") {
        recommendations.push({
          zone_id: "4",
          zone_name: "Zone 4 (MG Road)",
          recommendation: "Deploy emergency pumps and clear storm drains immediately."
        });
        recommendations.push({
          zone_id: "2",
          zone_name: "Zone 2 (Koramangala)",
          recommendation: "Close subways and divert traffic from 80ft road."
        });
      } else if (riskLevel === "medium") {
        recommendations.push({
          zone_id: "2",
          zone_name: "Zone 2 (Koramangala)",
          recommendation: "Inspect silt traps for blockages."
        });
      }

      setWeather({
        current: {
          temperature: currentTemp,
          precipitation: currentPrecipitation,
          humidity: currentHumidity,
        },
        forecast: {
          next_3_days_rainfall: totalRain3Days,
          max_probability: maxRainProb || (totalRain3Days > 0 ? 80 : 10), // OpenMeteo prob is sometimes null in free tier, fallback
        },
        waterlogging_risk: {
          score: riskScore,
          level: riskLevel,
          message: riskMessage,
        },
        high_risk_zones: highRiskZones,
        preventive_recommendations: recommendations,
      });

      toast({
        title: "Weather Updated",
        description: `Current Temp: ${currentTemp}°C, Rain: ${currentPrecipitation}mm`,
      });

    } catch (error: any) {
      console.warn("Weather fetch failed, using fallback:", error.message);
      // Fallback Data
      setWeather({
        current: { temperature: 28, precipitation: 0, humidity: 65 },
        forecast: { next_3_days_rainfall: 0, max_probability: 10 },
        waterlogging_risk: { score: 0.1, level: "low", message: "Data unavailable. Assuming normal conditions." },
        high_risk_zones: [],
        preventive_recommendations: [],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 15 * 60 * 1000); // 15 mins
    return () => clearInterval(interval);
  }, []);

  if (loading || !weather) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CloudRain className="h-5 w-5 animate-bounce" />
            Fetching Real-Time Weather...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const riskColor =
    weather.waterlogging_risk.level === "high"
      ? "destructive"
      : weather.waterlogging_risk.level === "medium"
        ? "secondary" // Yellow/Orange ish usually
        : "default"; // Green/Blue

  // Helper for badge color manually since 'secondary' is grey in some themes
  const badgeClass = weather.waterlogging_risk.level === "high" ? "bg-red-500 hover:bg-red-600" :
    weather.waterlogging_risk.level === "medium" ? "bg-yellow-500 hover:bg-yellow-600 text-black" :
      "bg-green-500 hover:bg-green-600";

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CloudRain className="h-5 w-5 text-blue-500" />
              Weather & Waterlogging Risk
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={fetchWeather}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>Real-time weather forecast from Open-Meteo API</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{weather.current.temperature}°C</div>
              <div className="text-sm text-muted-foreground">Temperature</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{weather.current.precipitation}mm</div>
              <div className="text-sm text-muted-foreground">Current Rain</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{weather.current.humidity}%</div>
              <div className="text-sm text-muted-foreground">Humidity</div>
            </div>
          </div>

          <Alert variant={weather.waterlogging_risk.level === "high" ? "destructive" : "default"} className={weather.waterlogging_risk.level === "medium" ? "border-yellow-500 bg-yellow-50" : ""}>
            <AlertTriangle className={`h-4 w-4 ${weather.waterlogging_risk.level === "medium" ? "text-yellow-600" : ""}`} />
            <AlertTitle className="flex items-center gap-2">
              Waterlogging Risk:
              <Badge className={badgeClass}>{weather.waterlogging_risk.level.toUpperCase()}</Badge>
            </AlertTitle>
            <AlertDescription className={weather.waterlogging_risk.level === "medium" ? "text-yellow-800" : ""}>
              {weather.waterlogging_risk.message}
            </AlertDescription>
          </Alert>

          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Droplets className="h-4 w-4 text-blue-500" />
              <span className="font-medium">3-Day Forecast</span>
            </div>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expected Rainfall:</span>
                <span className="font-medium">{weather.forecast.next_3_days_rainfall.toFixed(1)}mm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rain Probability:</span>
                <span className="font-medium">{weather.forecast.max_probability}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {weather.high_risk_zones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">High-Risk Zones</CardTitle>
            <CardDescription>Zones requiring immediate attention due to weather</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {weather.high_risk_zones.map((zone) => (
              <div key={zone.id} className="flex items-center justify-between p-3 border rounded-lg bg-red-50 border-red-100">
                <div>
                  <div className="font-medium text-red-900">{zone.name}</div>
                  <div className="text-sm text-red-700">
                    Flood Risk: {(zone.flood_risk_score * 100).toFixed(0)}%
                  </div>
                </div>
                <Badge variant="destructive">High Risk</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {weather.preventive_recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI Preventive Recommendations</CardTitle>
            <CardDescription>Automated actions based on real-time weather</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {weather.preventive_recommendations.map((rec, idx) => (
              <div key={idx} className="p-4 bg-muted rounded-lg space-y-2 border-l-4 border-l-blue-500">
                <div className="font-medium flex items-center gap-2">
                  <Badge variant="outline">{rec.zone_name}</Badge>
                </div>
                <p className="text-sm">{rec.recommendation}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
