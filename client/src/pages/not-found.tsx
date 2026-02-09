import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md border-2 border-border/50 shadow-xl">
        <CardContent className="pt-6 text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-red-100 p-4">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
          </div>

          <h1 className="mb-2 text-3xl font-bold text-gray-900 font-display">404 Page Not Found</h1>
          <p className="mb-8 text-gray-600">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>

          <Link href="/">
            <Button className="w-full py-6 text-base font-semibold">
              Return to Home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
