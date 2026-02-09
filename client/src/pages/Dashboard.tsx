import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/Header";
import { WasteScanner } from "@/components/WasteScanner";
import { useWasteHistory, useLeaderboard } from "@/hooks/use-waste";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trophy, Clock, Search, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: history, isLoading: historyLoading } = useWasteHistory();
  const { data: leaderboard } = useLeaderboard();

  // Basic filtering can be added here
  const [filter, setFilter] = useState("all");

  const filteredHistory = history?.filter(item => 
    filter === "all" ? true : item.category === filter
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Hello, {user?.firstName || "Eco-Warrior"}! 👋
            </h1>
            <p className="text-muted-foreground">Ready to make a difference today?</p>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Column: Scanner & History */}
          <div className="lg:col-span-8 space-y-8">
            <WasteScanner />

            {/* Recent History */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Recent Scans
                </h2>
                <div className="flex gap-2">
                  {["all", "Wet Waste", "Dry Waste", "Recyclable Waste"].map(cat => (
                    <Badge 
                      key={cat}
                      variant={filter === cat ? "default" : "outline"}
                      className="cursor-pointer capitalize"
                      onClick={() => setFilter(cat)}
                    >
                      {cat === "all" ? "All" : cat.split(" ")[0]}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {historyLoading ? (
                  Array(4).fill(0).map((_, i) => (
                    <div key={i} className="h-32 bg-muted/50 rounded-xl animate-pulse" />
                  ))
                ) : filteredHistory?.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-muted">
                    <Search className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p>No scans yet. Start sorting!</p>
                  </div>
                ) : (
                  filteredHistory?.slice(0, 6).map((item) => (
                    <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow border-border/50">
                      <div className="flex h-full">
                        <div className="w-24 bg-muted relative">
                          <img 
                            src={item.imageUrl} 
                            alt={item.detectedItem || 'Waste'} 
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-4 flex-1 flex flex-col justify-center">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-semibold capitalize truncate">{item.detectedItem}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              item.category === "Wet Waste" ? "bg-green-100 text-green-700" :
                              item.category === "Recyclable Waste" ? "bg-blue-100 text-blue-700" :
                              "bg-yellow-100 text-yellow-700"
                            }`}>
                              {item.category.split(" ")[0]}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                            {item.disposalInstruction}
                          </p>
                          <div className="flex items-center justify-between mt-auto">
                            <span className="text-xs text-muted-foreground">
                              {item.createdAt && format(new Date(item.createdAt), 'MMM d, h:mm a')}
                            </span>
                            {item.pointsChange && (
                              <span className={`text-xs font-bold ${item.pointsChange > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {item.pointsChange > 0 ? '+' : ''}{item.pointsChange} pts
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Leaderboard & Stats */}
          <div className="lg:col-span-4 space-y-8">
            <Card className="border-border/50 shadow-lg shadow-black/5 bg-card">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-accent" />
                  Top Recyclers
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  <div className="divide-y divide-border/50">
                    {leaderboard?.map((entry, index) => (
                      <div 
                        key={entry.id} 
                        className={`p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors ${
                          entry.userId === user?.id ? "bg-primary/5" : ""
                        }`}
                      >
                        <div className={`
                          w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm
                          ${index === 0 ? "bg-yellow-100 text-yellow-700" : 
                            index === 1 ? "bg-gray-100 text-gray-700" : 
                            index === 2 ? "bg-orange-100 text-orange-700" : "bg-muted text-muted-foreground"}
                        `}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {entry.firstName || entry.username || "Anonymous"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {entry.scansCount} scans
                          </p>
                        </div>
                        <div className="font-mono font-bold text-primary">
                          {entry.totalPoints}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground shadow-xl shadow-primary/20">
              <h3 className="font-bold text-lg mb-4 opacity-90">Did You Know?</h3>
              <p className="text-sm leading-relaxed opacity-90">
                Recycling one ton of paper can save 17 trees, 7,000 gallons of water, two barrels of oil, and 4,000 kilowatts of electricity.
              </p>
              <div className="mt-4 pt-4 border-t border-white/20 flex justify-between items-center text-sm font-medium">
                <span>Daily Tip #42</span>
                <Leaf className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
