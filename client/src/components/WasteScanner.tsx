import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, Loader2, RefreshCw, CheckCircle2, AlertTriangle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useWasteAnalysis, useConfirmDisposal } from "@/hooks/use-waste";
import type { AnalyzeWasteResponse } from "@shared/routes";

interface WasteScannerProps {
  onScanComplete?: () => void;
}

export function WasteScanner({ onScanComplete }: WasteScannerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeWasteResponse | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const analyzeMutation = useWasteAnalysis();
  const confirmMutation = useConfirmDisposal();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        analyzeImage(reader.result as string);
      };
      reader.readAsDataURL(selected);
    }
  };

  const analyzeImage = (base64: string) => {
    // Strip prefix if needed, usually backend handles it or we send as is depending on backend
    // The backend route expects "image" string.
    analyzeMutation.mutate(
      { image: base64 },
      {
        onSuccess: (data) => {
          setResult(data);
        },
      }
    );
  };

  const handleConfirm = (binType: "Wet Waste" | "Dry Waste" | "Recyclable Waste") => {
    if (!result?.id) return;
    
    confirmMutation.mutate(
      { wasteItemId: result.id, binType },
      {
        onSuccess: () => {
          setIsConfirmed(true);
          onScanComplete?.();
        },
      }
    );
  };

  const resetScanner = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setIsConfirmed(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getCategoryColor = (category: string) => {
    switch(category) {
      case "Wet Waste": return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
      case "Dry Waste": return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
      case "Recyclable Waste": return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="overflow-hidden border-2 border-border/50 shadow-xl bg-card">
      <AnimatePresence mode="wait">
        {!preview ? (
          <motion.div 
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-12 text-center border-dashed border-2 border-muted-foreground/20 rounded-xl m-4 bg-muted/30"
          >
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Camera className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold font-display mb-2">Scan Your Waste</h3>
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
              Take a photo or upload an image to instantly identify how to dispose of your waste correctly.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => fileInputRef.current?.click()} 
                size="lg" 
                className="rounded-full px-8 shadow-lg shadow-primary/20 hover:shadow-primary/30"
              >
                <Upload className="w-4 h-4 mr-2" /> Upload Image
              </Button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid md:grid-cols-2 gap-0"
          >
            {/* Image Preview Side */}
            <div className="relative bg-black/5 aspect-square md:aspect-auto flex items-center justify-center p-4">
              <img 
                src={preview} 
                alt="Uploaded waste" 
                className="max-h-full max-w-full rounded-lg shadow-lg object-contain"
              />
              <Button 
                variant="secondary" 
                size="sm" 
                className="absolute top-4 right-4 bg-white/90 backdrop-blur shadow-sm hover:bg-white"
                onClick={resetScanner}
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Scan New
              </Button>
            </div>

            {/* Analysis Side */}
            <div className="p-6 md:p-8 flex flex-col justify-center min-h-[400px]">
              {analyzeMutation.isPending ? (
                <div className="text-center py-10">
                  <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                  <h3 className="text-xl font-bold">Analyzing Waste...</h3>
                  <p className="text-muted-foreground">Identifying item and material composition</p>
                </div>
              ) : result ? (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Detected Item</span>
                      {result.confidence < 60 && (
                        <span className="flex items-center text-amber-600 text-xs font-medium bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
                          <AlertTriangle className="w-3 h-3 mr-1" /> Low Confidence
                        </span>
                      )}
                    </div>
                    <h2 className="text-3xl font-display font-bold text-foreground capitalize mb-3">
                      {result.detected_item}
                    </h2>
                    <div className={`inline-flex items-center px-4 py-2 rounded-full border text-sm font-bold ${getCategoryColor(result.category)}`}>
                      {result.category === "Wet Waste" && "🍏 Wet Waste"}
                      {result.category === "Dry Waste" && "🥡 Dry Waste"}
                      {result.category === "Recyclable Waste" && "♻️ Recyclable"}
                    </div>
                  </div>

                  <div className="space-y-3 p-4 bg-muted/50 rounded-xl border border-border/50">
                    <div className="flex gap-3">
                      <HelpCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-foreground">Why here?</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{result.educational_explanation}</p>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2 border-t border-border/50">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-foreground">Disposal Instruction</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{result.disposal_instruction}</p>
                      </div>
                    </div>
                  </div>

                  {!isConfirmed && result.certainty === "certain" && (
                    <div className="pt-4 border-t border-border/50">
                      <p className="text-sm font-medium text-center mb-4 text-muted-foreground">Confirm disposal to earn points:</p>
                      <div className="grid grid-cols-3 gap-2">
                        {["Wet Waste", "Dry Waste", "Recyclable Waste"].map((type) => (
                          <Button 
                            key={type}
                            variant="outline" 
                            className="h-auto py-3 px-2 text-xs sm:text-sm font-medium whitespace-normal text-center hover:border-primary hover:text-primary transition-colors"
                            onClick={() => handleConfirm(type as any)}
                            disabled={confirmMutation.isPending}
                          >
                            {type.split(' ')[0]}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {isConfirmed && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-green-50 border border-green-200 rounded-xl p-4 text-center text-green-800"
                    >
                      <p className="font-bold text-lg">Disposal Confirmed!</p>
                      <p className="text-sm opacity-90">Points have been updated.</p>
                      <Button onClick={resetScanner} variant="link" className="mt-1 text-green-700 font-bold">
                        Scan Another Item
                      </Button>
                    </motion.div>
                  )}

                  {result.certainty === "uncertain" && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                      <p className="font-bold mb-1">Not sure about this one?</p>
                      <p>{result.retry_message || "Please try taking a clearer photo with better lighting."}</p>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="mt-3 w-full bg-amber-200 hover:bg-amber-300 border-transparent text-amber-900"
                        onClick={resetScanner}
                      >
                        Try Again
                      </Button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
