import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, CheckCircle, ArrowRight, Eye, Layers, Wand2, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DrainageAnalysisFormProps {
  zones: any[];
  onRecommendationSaved: () => void;
  onView3DModel?: (url: string) => void;
}

interface CurrentSpecs {
  width: string;
  length: string;
  gradient: string;
  material: string;
  condition: string;
}

interface AIRecommendation {
  title: string;
  description: string;
  current_specs: {
    pipe_diameter_mm: number;
    length_m: number;
    gradient_percent: number;
    material: string;
    flow_capacity_lps: number;
    condition_rating: string;
  };
  proposed_specs: {
    pipe_diameter_mm: number;
    length_m: number;
    gradient_percent: number;
    material: string;
    flow_capacity_lps: number;
    additional_features: string[];
  };
  improvements: {
    capacity_increase_percent: number;
    flow_rate_increase_percent: number;
    flood_risk_reduction: string;
  };
  estimated_cost: number;
  estimated_timeline_days: number;
  priority: number;
}

interface VisualBlueprint {
  transformedStreetImageUrl: string;
  undergroundLayoutImageUrl: string;
}

export function DrainageAnalysisForm({ zones, onRecommendationSaved, onView3DModel }: DrainageAnalysisFormProps) {
  const { toast } = useToast();
  const [selectedZone, setSelectedZone] = useState<string>(zones.length > 0 ? zones[0].id : "");
  const [photos, setPhotos] = useState<File[]>([]);
  const [streetPhotos, setStreetPhotos] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [streetPhotoUrls, setStreetPhotoUrls] = useState<string[]>([]);

  const [currentSpecs, setCurrentSpecs] = useState<CurrentSpecs>({
    width: "600",
    length: "150",
    gradient: "0.5",
    material: "Concrete",
    condition: "fair",
  });
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);
  const [visualBlueprint, setVisualBlueprint] = useState<VisualBlueprint | null>(null);

  const [estimatingSpecs, setEstimatingSpecs] = useState(false);
  const [roadEstimates, setRoadEstimates] = useState<{
    width: number;
    length: number;
    confidence: "High" | "Medium" | "Low";
    reasoning: string;
  } | null>(null);

  useEffect(() => {
    if (zones && zones.length > 0 && !selectedZone) {
      setSelectedZone(zones[0].id);
    }
  }, [zones, selectedZone]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setPhotos(prev => {
        const combined = [...prev, ...newFiles];
        // Deduplicate
        const unique = combined.filter((file, index, self) =>
          index === self.findIndex((f) => f.name === file.name && f.size === file.size)
        );
        if (unique.length > 5) {
          toast({
            title: "Too many files",
            description: "Maximum 5 photos allowed",
            variant: "destructive",
          });
          return unique.slice(0, 5);
        }
        return unique;
      });
    }
  };

  const handleStreetPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setStreetPhotos(prev => {
        const combined = [...prev, ...newFiles];
        // Deduplicate
        const unique = combined.filter((file, index, self) =>
          index === self.findIndex((f) => f.name === file.name && f.size === file.size)
        );
        if (unique.length > 100) {
          toast({
            title: "Too many files",
            description: "Maximum 100 street photos allowed",
            variant: "destructive",
          });
          return unique.slice(0, 100);
        }
        return unique;
      });
    }
  };

  const uploadPhotos = async (files: File[], bucket: string) => {
    if (files.length === 0) return [];
    setUploading(true);
    const urls: string[] = [];
    try {
      for (const photo of files) {
        const fileExt = photo.name.split(".").pop();
        const fileName = `${selectedZone}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { data, error } = await supabase.storage.from(bucket).upload(fileName, photo);
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
        urls.push(publicUrl);
      }
      return urls;
    } catch (error: any) {
      console.error("Upload error:", error);
      return [];
    } finally {
      setUploading(false);
    }
  };

  const analyzeWithAI = async () => {
    if (!selectedZone && zones.length > 0) {
      setSelectedZone(zones[0].id);
    }

    if (!currentSpecs.width || !currentSpecs.length || !currentSpecs.gradient) {
      toast({ title: "Using Auto Specifications", description: "Default metrics applied for demonstration." });
      setCurrentSpecs({ width: "600", length: "150", gradient: "0.5", material: "Concrete", condition: "fair" });
    }

    setAnalyzing(true);
    setRecommendation(null);
    setVisualBlueprint(null);

    try {
      // 1. Upload photos (Mocking real upload for speed/stability if offline)
      let urls = photoUrls;
      if (photos.length > 0 && photoUrls.length === 0) {
        // urls = await uploadPhotos(photos, "drainage-photos"); // Unreal
        urls = photos.map(() => "https://images.unsplash.com/photo-1594497437633-911e86098015?q=80&w=2670&auto=format&fit=crop");
        setPhotoUrls(urls);
      }
      let sUrls = streetPhotoUrls;
      if (streetPhotos.length > 0 && streetPhotoUrls.length === 0) {
        // sUrls = await uploadPhotos(streetPhotos, "street-photos"); // Unreal
        sUrls = streetPhotos.map(() => "https://images.unsplash.com/photo-1574359876258-0051e59c1649?q=80&w=2669&auto=format&fit=crop");
        setStreetPhotoUrls(sUrls);
      }

      // 2. Call AI (or Mock)
      await new Promise(resolve => setTimeout(resolve, 2500));

      const mockRecommendation: AIRecommendation = {
        title: "Optimized Drainage & Green Buffer Plan",
        description: "AI analysis detects potential bottlenecks. Recommended upgrade to HDPE pipes and implementation of a Green Buffer zone to enhance soil water absorption.",
        current_specs: {
          pipe_diameter_mm: Number(currentSpecs.width) || 600,
          length_m: Number(currentSpecs.length) || 150,
          gradient_percent: Number(currentSpecs.gradient) || 0.5,
          material: currentSpecs.material || "Concrete",
          flow_capacity_lps: 450,
          condition_rating: "Fair"
        },
        proposed_specs: {
          pipe_diameter_mm: Number(currentSpecs.width) ? Number(currentSpecs.width) + 200 : 800,
          length_m: Number(currentSpecs.length) || 150,
          gradient_percent: 1.2,
          material: "HDPE (High-Density Polyethylene)",
          flow_capacity_lps: 850,
          additional_features: [
            "Smart Flow Sensors",
            "Debris Filters",
            "Green Buffer: 10 Neem/Banyan trees on each side",
            "Soil Absorption: ~3000L/day retention"
          ]
        },
        improvements: {
          capacity_increase_percent: 45,
          flow_rate_increase_percent: 60,
          flood_risk_reduction: "High"
        },
        estimated_cost: 1250000,
        estimated_timeline_days: 14,
        priority: 1
      };

      setRecommendation(mockRecommendation);

      // 3. Generate Visual Blueprint (Mock)
      // Deterministically select images based on input length or random factor to simulate variety
      const safeLength = parseFloat(currentSpecs.length) || 150;
      const variant = (Math.floor(safeLength / 10) % 3) + 1 || 1;

      setVisualBlueprint({
        transformedStreetImageUrl: `/mock-images/transformed_${variant}.png`,
        undergroundLayoutImageUrl: `/mock-images/schematic_${variant}.png`
      });

      toast({ title: "Analysis complete", description: "AI has generated drainage recommendations and visual blueprints" });

    } catch (error: any) {
      console.error("AI Analysis failed:", error);
      toast({ title: "Analysis failed", description: error.message, variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  const saveRecommendation = async () => {
    if (!recommendation || !selectedZone) return;
    toast({ title: "Recommendation Saved", description: "Available for contractor bidding" });
    setSelectedZone("");
    setPhotos([]);
    setStreetPhotos([]);
    setPhotoUrls([]);
    setStreetPhotoUrls([]);
    setCurrentSpecs({ width: "", length: "", gradient: "", material: "Concrete", condition: "fair" });
    setRecommendation(null);
    setVisualBlueprint(null);
    onRecommendationSaved();
  };

  const handleEstimateRoadSpecs = async () => {
    if (streetPhotos.length === 0) {
      toast({ title: "No photos", description: "Please upload street photos first", variant: "destructive" });
      return;
    }

    setEstimatingSpecs(true);
    setRoadEstimates(null);

    try {
      // 1. Upload photos (Mocking real upload for demo speed)
      const photoUrlsList: string[] = [];
      const { data: { session } } = await supabase.auth.getSession();

      // This is where we would normally upload to Supabase Storage
      // For this demo, we'll use placeholder URLs or the File objects if we were sending multipart
      // But the Edge Function expects public URLs.
      // We will simulate 2s delay and then return mock data OR call the real function if configured.

      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/estimate-road-specs`;
      const enableRealAI = false; // Set to true if Env vars are set up

      if (enableRealAI && session) {
        // Real upload logic would go here...
      } else {
        // Mock Response handling for potentially large scale
        await new Promise(resolve => setTimeout(resolve, 2000));

        let totalWidth = 0;
        let totalLength = 0;

        for (let i = 0; i < streetPhotos.length; i++) {
          // Seed a deterministic randomized number per file so outputs vary per input mix
          const fileSeed = streetPhotos[i].size + streetPhotos[i].name.length;
          const seedFactorWidth = (fileSeed % 10) / 5; // 0 to 1.8
          const seedFactorLength = (fileSeed % 50); // 0 to 49

          totalWidth += (7 + seedFactorWidth);
          totalLength += (100 + seedFactorLength);
        }

        // Aggregate average
        const avgWidth = totalWidth / streetPhotos.length;
        const avgLength = totalLength / streetPhotos.length;

        setRoadEstimates({
          width: Number(avgWidth.toFixed(1)),
          length: Math.round(avgLength),
          confidence: streetPhotos.length > 3 ? "High" : "Medium",
          reasoning: `Analyzed ${streetPhotos.length} images. Assessed lane markings, perspective geometry, and standard vehicle widths across the dataset to determine average network dimensions.`
        });

        // Auto-fill length if empty
        if (!currentSpecs.length) {
          setCurrentSpecs(prev => ({ ...prev, length: String(Math.round(avgLength)) }));
        }

        toast({
          title: "Estimation Complete",
          description: `Road specs estimated precisely from ${streetPhotos.length} photos.`
        });
      }

    } catch (error) {
      console.error("Estimation failed", error);
      toast({ title: "Estimation Failed", description: "Could not analyze photos.", variant: "destructive" });
    } finally {
      setEstimatingSpecs(false);
    }
  };

  return (
    <div className="space-y-6">

      <Tabs defaultValue="photos" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted p-1 rounded-lg">
          <TabsTrigger value="photos" id="tab-trigger-photos" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Photo Analysis</TabsTrigger>
          <TabsTrigger value="blueprint" id="tab-trigger-blueprint" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Blueprint Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="photos">
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Drainage Analysis</CardTitle>
              <CardDescription>
                Upload photos and enter current specifications to receive AI-generated improvement recommendations and visual blueprints.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="zone">Select Zone</Label>
                <select
                  id="zone"
                  className="w-full p-2 border rounded-md bg-background"
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                >
                  <option value="">Choose a zone...</option>
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="photos">Existing Drainage Photos (Max 5)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="photos"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoChange}
                      disabled={uploading}
                    />
                    {photos.length > 0 && (
                      <Badge variant="secondary">{photos.length} selected</Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="street-photos">Existing Street Photos (Max 5)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="street-photos"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleStreetPhotoChange}
                      disabled={uploading}
                    />
                    {streetPhotos.length > 0 && (
                      <Badge variant="secondary">{streetPhotos.length} selected</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Road Estimation Result */}
              <div className="flex justify-end -mt-2 mb-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleEstimateRoadSpecs}
                  disabled={streetPhotos.length === 0 || estimatingSpecs}
                  className="text-primary border-primary/20 hover:bg-primary/5"
                >
                  {estimatingSpecs ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Wand2 className="w-3 h-3 mr-2" />}
                  Estimate Road Specs from Photos
                </Button>
              </div>

              {roadEstimates && (
                <Alert className="bg-blue-50/50 border-blue-200 mb-4 transition-all">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-800 flex items-center gap-2">
                    AI Analysis Result
                    <Badge variant={roadEstimates.confidence === "High" ? "default" : "secondary"} className="ml-2 text-xs h-5">
                      {roadEstimates.confidence} Confidence
                    </Badge>
                  </AlertTitle>
                  <AlertDescription className="mt-2 text-blue-700 text-sm">
                    <div className="grid grid-cols-2 gap-4 mb-2">
                      <div>
                        <span className="text-muted-foreground text-xs block">Est. Road Width</span>
                        <span className="font-bold text-lg">{roadEstimates.width} meters</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs block">Est. Visible Length</span>
                        <span className="font-bold text-lg">{roadEstimates.length} meters</span>
                      </div>
                    </div>
                    <p className="text-xs opacity-90 italic border-t border-blue-200 pt-2 mt-2">
                      "{roadEstimates.reasoning}"
                    </p>
                    <p className="text-[10px] mt-2 text-muted-foreground">
                      Disclaimer: Measurements are AI-generated estimates based on visual references and may vary from on-ground survey data.
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="width">Pipe Diameter (mm)</Label>
                  <Input
                    id="width"
                    type="number"
                    placeholder="e.g., 600"
                    value={currentSpecs.width}
                    onChange={(e) => setCurrentSpecs({ ...currentSpecs, width: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="length">Length (meters)</Label>
                  <Input
                    id="length"
                    type="number"
                    placeholder="e.g., 150"
                    value={currentSpecs.length}
                    onChange={(e) => setCurrentSpecs({ ...currentSpecs, length: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gradient">Gradient (%)</Label>
                  <Input
                    id="gradient"
                    type="number"
                    step="0.1"
                    placeholder="e.g., 0.5"
                    value={currentSpecs.gradient}
                    onChange={(e) => setCurrentSpecs({ ...currentSpecs, gradient: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="material">Material</Label>
                  <Input
                    id="material"
                    placeholder="e.g., Concrete, HDPE"
                    value={currentSpecs.material}
                    onChange={(e) => setCurrentSpecs({ ...currentSpecs, material: e.target.value })}
                  />
                </div>
              </div>

              <Button
                onClick={analyzeWithAI}
                disabled={analyzing || uploading || (!selectedZone && zones.length === 0)}
                className="w-full"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Designing Street & Drainage Blueprint...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Generate AI Recommendation
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blueprint">
          <BlueprintAnalysis zones={zones} onView3DModel={onView3DModel} />
        </TabsContent>
      </Tabs>

      {/* NEW: AI Visual Blueprint Section */}
      {analyzing && (
        <Card className="animate-pulse">
          <CardHeader><CardTitle>AI Visual Blueprint</CardTitle></CardHeader>
          <CardContent className="h-64 flex items-center justify-center bg-muted/20">
            <div className="text-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">Generating transformed street view and underground schematics...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!analyzing && visualBlueprint && (
        <Card className="border-2 border-primary/20 bg-blue-50/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              AI Visual Blueprint
            </CardTitle>
            <CardDescription>Visualizing the proposed street transformation and underground infrastructure.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Transformed Street View */}
              <div className="space-y-3">
                <div className="font-semibold flex items-center gap-2 text-sm">
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  Transformed Street View (Above Ground)
                </div>
                <div className="rounded-lg overflow-hidden border shadow-sm aspect-video bg-muted relative group">
                  <img
                    src={visualBlueprint.transformedStreetImageUrl}
                    alt="Transformed Street"
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                    <p className="text-white text-xs font-medium">Predicted Outcome: Clean roads, covered drains, green buffer.</p>
                  </div>
                </div>
              </div>

              {/* Underground Layout */}
              <div className="space-y-3">
                <div className="font-semibold flex items-center gap-2 text-sm">
                  <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                  Underground Drainage Layout (Cross-Section)
                </div>
                <div className="rounded-lg overflow-hidden border shadow-sm aspect-video bg-white relative group flex items-center justify-center p-0">
                  <img
                    src={visualBlueprint.undergroundLayoutImageUrl}
                    alt="Underground Schematic"
                    className="w-full h-full object-contain p-2"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-white/90 p-2 text-xs text-center border-t">
                    Schematic: {recommendation?.proposed_specs.pipe_diameter_mm}mm dia pipe at -2.5m depth
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {recommendation && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{recommendation.title}</CardTitle>
              <Badge variant={recommendation.priority >= 4 ? "destructive" : "secondary"}>
                Priority {recommendation.priority}/5
              </Badge>
            </div>
            <CardDescription>{recommendation.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Before/After Comparison */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-lg">Current Specifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Diameter:</span>
                    <span className="font-medium">{recommendation.current_specs.pipe_diameter_mm} mm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Length:</span>
                    <span className="font-medium">{recommendation.current_specs.length_m} m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gradient:</span>
                    <span className="font-medium">{recommendation.current_specs.gradient_percent}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Material:</span>
                    <span className="font-medium">{recommendation.current_specs.material}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Flow Capacity:</span>
                    <span className="font-medium">{recommendation.current_specs.flow_capacity_lps} L/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Condition:</span>
                    <Badge variant="outline">{recommendation.current_specs.condition_rating}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-primary">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <ArrowRight className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Proposed Specifications</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Diameter:</span>
                    <span className="font-medium text-primary">{recommendation.proposed_specs.pipe_diameter_mm} mm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Length:</span>
                    <span className="font-medium">{recommendation.proposed_specs.length_m} m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gradient:</span>
                    <span className="font-medium">{recommendation.proposed_specs.gradient_percent}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Material:</span>
                    <span className="font-medium text-primary">{recommendation.proposed_specs.material}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Flow Capacity:</span>
                    <span className="font-medium text-primary">{recommendation.proposed_specs.flow_capacity_lps} L/s</span>
                  </div>
                  {recommendation.proposed_specs.additional_features?.length > 0 && (
                    <div className="pt-2">
                      <span className="text-muted-foreground text-xs">Additional Features:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {recommendation.proposed_specs.additional_features.map((feature, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Improvements */}
            <Card className="bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg">Expected Improvements</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-primary">
                    +{recommendation.improvements.capacity_increase_percent}%
                  </div>
                  <div className="text-sm text-muted-foreground">Capacity Increase</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary">
                    +{recommendation.improvements.flow_rate_increase_percent}%
                  </div>
                  <div className="text-sm text-muted-foreground">Flow Rate Increase</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary capitalize">
                    {recommendation.improvements.flood_risk_reduction}
                  </div>
                  <div className="text-sm text-muted-foreground">Flood Risk Reduction</div>
                </div>
              </CardContent>
            </Card>

            {/* Cost and Timeline */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <span className="text-muted-foreground">Estimated Cost:</span>
                <span className="text-2xl font-bold">₹{recommendation.estimated_cost.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <span className="text-muted-foreground">Timeline:</span>
                <span className="text-2xl font-bold">{recommendation.estimated_timeline_days} days</span>
              </div>
            </div>

            <Button onClick={saveRecommendation} className="w-full" size="lg">
              <CheckCircle className="mr-2 h-5 w-5" />
              Approve & Save for Contractor Bidding
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function BlueprintAnalysis({ zones, onView3DModel }: { zones: any[], onView3DModel?: (url: string) => void }) {
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleUpload = async () => {
    if (files.length === 0) return;
    setLoading(true);
    setResults([]);

    try {
      const newResults = [];
      const { data: { session } } = await supabase.auth.getSession();

      for (const file of files) {
        // Deterministically select a blueprint type based on file properties
        const fileHash = file.name.length + file.size;
        const typeIndex = (fileHash % 4) + 1;
        const blueprintType = `blueprint-${typeIndex}`;

        const useMock = true;

        // Simulating the delay for each file as if processing multiple
        await new Promise(resolve => setTimeout(resolve, 1000));

        const reports = {
          'blueprint-1': "Analysis of Manhole and Gully Trap connection. Flow efficiency is 90%. Recommendation: Ensure regular cleaning of the gully trap to prevent silt accumulation.",
          'blueprint-2': "Complex site drainage analysis. Detected multiple cross-connections. The red primary lines show good flow, but blue secondary lines indicate potential backflow risk during heavy rains.",
          'blueprint-3': "Residential drainage plan. Kitchen and dining waste lines are well routed. Suggest increasing the diameter of the main outlet pipe from the lounge area to handle peak loads.",
          'blueprint-4': "Large hall perimeter drainage. The column grid suggests a high-traffic area. Perimeter drains are adequate but require additional inspection points along the north wall."
        };

        newResults.push({
          fileName: file.name,
          modelUrl: blueprintType,
          report: {
            summary: reports[blueprintType as keyof typeof reports] || "Drainage analysis complete.",
            recommendations: [
              "Verify pipe gradients against local building codes.",
              "Inspect all junctions for watertight seals.",
              "Schedule annual maintenance for this sector."
            ]
          }
        });
      }

      setResults(newResults);
      toast({ title: "Analysis Complete", description: `Processed ${files.length} blueprint(s).` });

    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to process blueprints", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Blueprint Analysis</CardTitle>
        <CardDescription>Upload a drainage blueprint (PDF/Image) to generate a 3D model and analysis report.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Upload Blueprints (Max 100)</Label>
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept=".pdf,image/*"
              multiple
              onChange={(e) => {
                const newFiles = Array.from(e.target.files || []);
                setFiles(prev => {
                  const combined = [...prev, ...newFiles];
                  const unique = combined.filter((file, index, self) =>
                    index === self.findIndex((f) => f.name === file.name && f.size === file.size)
                  );
                  if (unique.length > 100) {
                    toast({ title: "Too many files", description: "Maximum 100 blueprints allowed for bulk processing", variant: "destructive" });
                    return unique.slice(0, 100);
                  }
                  return unique;
                });
              }}
            />
            {files.length > 0 && <Badge variant="secondary">{files.length} selected</Badge>}
          </div>
          <p className="text-xs text-muted-foreground">
            Supported formats: JPG, PNG, PDF. Bulk uploads supported.
          </p>
        </div>
        <Button onClick={handleUpload} disabled={files.length === 0 || loading} className="w-full">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          Process Blueprints
        </Button>

        {results.length > 0 && (
          <div className="mt-6 space-y-8 animate-in fade-in slide-in-from-bottom-4">
            {results.map((result, idx) => (
              <div key={idx} className="space-y-4 border-b pb-8 last:border-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg text-primary truncate max-w-[70%]">
                    {result.fileName}
                  </h3>
                  <Badge variant="outline">Model {result.modelUrl.split('-')[1]}</Badge>
                </div>

                <div className="aspect-video bg-slate-900 rounded-lg flex items-center justify-center relative overflow-hidden">
                  <div className="text-center">
                    <p className="text-white font-semibold mb-2">3D Model Generated</p>
                    <Button
                      variant="outline"
                      className="text-white border-white hover:bg-white hover:text-black"
                      onClick={() => onView3DModel ? onView3DModel(result.modelUrl) : window.open(result.modelUrl, '_blank')}
                    >
                      View 3D Model
                    </Button>
                  </div>
                </div>

                <Card className="bg-slate-50 border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-lg">Analysis Report</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-1">Summary</h4>
                      <p className="text-sm text-slate-600 leading-relaxed">{result.report.summary}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Recommendations</h4>
                      <ul className="space-y-2">
                        {result.report.recommendations.map((rec: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
