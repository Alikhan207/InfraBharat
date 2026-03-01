import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { LanguageSelector } from "@/components/language-selector";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/NotificationBell";
import { FileText, DollarSign, Clock, TrendingUp, LogOut, Radio, Star, ShieldCheck } from "lucide-react";

export default function ContractorDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [myBids, setMyBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRec, setSelectedRec] = useState<any>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [estimatedDays, setEstimatedDays] = useState("");
  const [proposalDetails, setProposalDetails] = useState("");

  useEffect(() => {
    const init = async () => {
      // Check for demo mode
      const demoRole = localStorage.getItem("demo_role");
      if (demoRole === "contractor" || demoRole === "official") {
        fetchData("demo-user-id");
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        fetchData(user.id);
      }
    };
    init();
  }, []);

  const fetchData = async (userId: string) => {
    const applyMockData = () => {
      setRecommendations([
        {
          id: '205',
          title: 'Approved AI Analysis Rebuilt Plan: Sector 4 Drainage',
          description: 'Execution of the AI-optimized drainage network rebuild based on the approved 3D model analysis. Includes pipe expansion and smart sensor integration.',
          priority: 1,
          estimated_cost: 1500000,
          estimated_timeline_days: 14,
          zones: { name: 'Zone 4 (MG Road)', ward_number: '45' },
          is_live: true
        },
        {
          id: '201',
          title: 'Install High-Capacity Pump',
          description: 'Deploy 5000L/min pump at Zone 4 junction to mitigate flash flood risk.',
          priority: 5,
          estimated_cost: 450000,
          estimated_timeline_days: 5,
          zones: { name: 'Zone 4 (MG Road)', ward_number: '45' }
        },
        {
          id: '202',
          title: 'Clear Drainage Blockage',
          description: 'Automated desilting required for Sector 2 main line.',
          priority: 3,
          estimated_cost: 120000,
          estimated_timeline_days: 2,
          zones: { name: 'Zone 2 (Koramangala)', ward_number: '12' }
        }
      ]);

      setMyBids([
        {
          id: '301',
          status: 'pending',
          bid_amount: 440000,
          estimated_days: 4,
          submitted_at: new Date().toISOString(),
          ai_recommendations: {
            title: 'Install High-Capacity Pump',
            estimated_cost: 450000,
            zones: { name: 'Zone 4 (MG Road)' }
          }
        }
      ]);
      setLoading(false);
    };

    if (userId === "demo-user-id") {
      console.log("Loading mock data for demo user");
      applyMockData();
      return;
    }

    setLoading(true);

    try {
      // Fetch available recommendations
      const { data: recs, error: recsError } = await supabase
        .from("ai_recommendations")
        .select(`
          *,
          zones(name, ward_number)
        `)
        .eq("status", "open_for_bidding")
        .order("created_at", { ascending: false });

      if (recsError) throw recsError;

      // Fetch contractor's bids
      const { data: bids, error: bidsError } = await supabase
        .from("contractor_bids")
        .select(`
          *,
          ai_recommendations(title, estimated_cost, zones(name))
        `)
        .eq("contractor_id", userId)
        .order("submitted_at", { ascending: false });

      if (bidsError) throw bidsError;

      setRecommendations(recs || []);
      setMyBids(bids || []);
    } catch (error) {
      console.log("Using mock data due to error:", error);
      applyMockData();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRec) return;

    // Simulate bid submission for demo
    const newBid = {
      id: Math.random().toString(),
      status: 'pending',
      bid_amount: parseFloat(bidAmount),
      estimated_days: parseInt(estimatedDays),
      submitted_at: new Date().toISOString(),
      proposal_details: proposalDetails,
      ai_recommendations: {
        title: selectedRec.title,
        estimated_cost: selectedRec.estimated_cost,
        zones: selectedRec.zones
      }
    };

    setMyBids([newBid, ...myBids]);

    toast({
      title: "Bid Submitted Successfully",
      description: "Your proposal has been sent to the official for review.",
    });

    setSelectedRec(null);
    setBidAmount("");
    setEstimatedDays("");
    setProposalDetails("");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("demo_role");
    navigate("/");
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">Contractor Dashboard</h1>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 animate-pulse">
              <Radio className="w-3 h-3 mr-1" /> Live Bidding Active
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <LanguageSelector />
            <ThemeToggle />
            <Button onClick={handleLogout} variant="ghost" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Bids</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myBids.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-tr from-amber-50 to-orange-50 border-amber-200 shadow-sm relative overflow-hidden group">
            <div className="absolute opacity-10 right-0 top-0 -mr-4 -mt-4 transition-transform group-hover:scale-110">
              <ShieldCheck className="w-24 h-24 text-amber-600" />
            </div>
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-sm font-bold text-amber-900">Reputation Score</CardTitle>
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-extrabold text-amber-600 flex items-center gap-2">
                4.8<span className="text-sm font-medium text-amber-700/70">/5.0</span>
              </div>
              <p className="text-xs font-semibold text-amber-800 mt-1 flex items-center">
                <ShieldCheck className="h-3 w-3 mr-1" /> 145 Citizen Verifications
              </p>
              <p className="text-[10px] text-amber-700/80 mt-1 leading-tight">
                High score increases priority in AI bidding allocation.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Accepted</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {myBids.filter(b => b.status === 'accepted').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {myBids.filter(b => b.status === 'pending').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Opportunities</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{recommendations.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="opportunities">
          <TabsList>
            <TabsTrigger value="opportunities">Available Projects</TabsTrigger>
            <TabsTrigger value="mybids">My Bids</TabsTrigger>
          </TabsList>

          <TabsContent value="opportunities" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recommendations.map((rec) => (
                <Card key={rec.id} className={`hover:shadow-lg transition-shadow ${rec.is_live ? 'border-green-500 border-2' : ''}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">{rec.title}</CardTitle>
                      {rec.is_live && (
                        <Badge className="bg-red-500 hover:bg-red-600 animate-pulse">
                          LIVE BIDDING
                        </Badge>
                      )}
                    </div>
                    <CardDescription>
                      {rec.zones?.name} - Ward {rec.zones?.ward_number}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{rec.description}</p>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium">Estimated Cost</div>
                        <div className="text-lg font-bold text-green-600">
                          ₹{rec.estimated_cost?.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Timeline</div>
                        <div className="text-lg font-bold text-blue-600">
                          {rec.estimated_timeline_days} days
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge variant={rec.priority === 1 ? "destructive" : "secondary"}>
                        Priority {rec.priority}
                      </Badge>
                      {rec.is_live && (
                        <span className="text-xs text-red-500 font-bold flex items-center">
                          <Clock className="w-3 h-3 mr-1" /> Ends in 2h 15m
                        </span>
                      )}
                    </div>

                    <Button
                      onClick={() => setSelectedRec(rec)}
                      className={`w-full ${rec.is_live ? 'bg-green-600 hover:bg-green-700' : ''}`}
                    >
                      {rec.is_live ? 'Place Bid Now' : 'Submit Bid'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="mybids" className="space-y-4">
            {myBids.map((bid) => (
              <Card key={bid.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{bid.ai_recommendations?.title}</CardTitle>
                    <Badge
                      variant={
                        bid.status === 'accepted' ? 'default' :
                          bid.status === 'rejected' ? 'destructive' :
                            'secondary'
                      }
                    >
                      {bid.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    {bid.ai_recommendations?.zones?.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Bid Amount</div>
                      <div className="text-lg font-bold">₹{bid.bid_amount?.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Estimated Days</div>
                      <div className="text-lg font-bold">{bid.estimated_days}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Submitted</div>
                      <div className="text-sm">{new Date(bid.submitted_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  {bid.proposal_details && (
                    <div className="mt-4">
                      <div className="text-sm font-medium">Proposal Details</div>
                      <p className="text-sm text-muted-foreground mt-1">{bid.proposal_details}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* Bid Submission Modal */}
        {selectedRec && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl animate-in zoom-in-95 duration-200">
              <CardHeader>
                <CardTitle>Submit Bid: {selectedRec.title}</CardTitle>
                <CardDescription>
                  Estimated Cost: ₹{selectedRec.estimated_cost?.toLocaleString()} |
                  Timeline: {selectedRec.estimated_timeline_days} days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitBid} className="space-y-4">
                  <div>
                    <Label htmlFor="bidAmount">Your Bid Amount (₹)</Label>
                    <Input
                      id="bidAmount"
                      type="number"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      required
                      placeholder="e.g. 1450000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="estimatedDays">Estimated Days</Label>
                    <Input
                      id="estimatedDays"
                      type="number"
                      value={estimatedDays}
                      onChange={(e) => setEstimatedDays(e.target.value)}
                      required
                      placeholder="e.g. 12"
                    />
                  </div>
                  <div>
                    <Label htmlFor="proposalDetails">Proposal Details</Label>
                    <Textarea
                      id="proposalDetails"
                      value={proposalDetails}
                      onChange={(e) => setProposalDetails(e.target.value)}
                      rows={4}
                      placeholder="Describe your approach, materials, and why you are the best fit..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">Submit Bid</Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSelectedRec(null)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
