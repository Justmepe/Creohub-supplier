import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import logoPath from "@assets/Logo_1749474304178.png";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  X,
  Store,
  ShoppingCart,
  CreditCard,
  BarChart3,
  Upload,
  Settings
} from "lucide-react";

interface DemoStep {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  duration: number;
  screenshot: string;
}

const demoSteps: DemoStep[] = [
  {
    id: 1,
    title: "Create Your Store",
    description: "Set up your creator storefront in minutes with our simple onboarding process.",
    icon: Store,
    duration: 15,
    screenshot: "🏪"
  },
  {
    id: 2,
    title: "Upload Products",
    description: "Add digital products, physical merchandise, or services with drag-and-drop simplicity.",
    icon: Upload,
    duration: 20,
    screenshot: "📦"
  },
  {
    id: 3,
    title: "Share Your Link",
    description: "Get a beautiful, mobile-optimized storefront at creohub.com/yourstore",
    icon: Settings,
    duration: 10,
    screenshot: "🔗"
  },
  {
    id: 4,
    title: "Accept Payments",
    description: "Receive payments through M-Pesa, cards, and bank transfers across Africa.",
    icon: CreditCard,
    duration: 25,
    screenshot: "💳"
  },
  {
    id: 5,
    title: "Track Analytics",
    description: "Monitor sales, customer behavior, and earnings with detailed analytics.",
    icon: BarChart3,
    duration: 15,
    screenshot: "📊"
  },
  {
    id: 6,
    title: "Grow Your Business",
    description: "Scale from side hustle to full business with our growth tools and insights.",
    icon: ShoppingCart,
    duration: 20,
    screenshot: "🚀"
  }
];

interface PlatformDemoProps {
  onClose: () => void;
}

export default function PlatformDemo({ onClose }: PlatformDemoProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const currentStepData = demoSteps[currentStep];

  const nextStep = () => {
    if (currentStep < demoSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      setProgress(0);
    } else {
      setCurrentStep(0);
      setProgress(0);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setProgress(0);
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  // Simulate progress animation
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            nextStep();
            return 0;
          }
          return prev + (100 / (currentStepData.duration * 10));
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isPlaying, currentStep]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-white">
            <div className="flex items-center space-x-3">
              <img 
                src={logoPath} 
                alt="Creohub" 
                className="h-8 w-8"
              />
              <h2 className="text-2xl font-bold text-primary">Platform Demo</h2>
              <Badge variant="outline">Interactive Walkthrough</Badge>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Demo Content */}
          <div className="grid md:grid-cols-2 h-[600px]">
            {/* Video/Screenshot Area */}
            <div className="bg-gray-100 flex items-center justify-center relative">
              <div className="text-8xl">{currentStepData.screenshot}</div>
              
              {/* Play Overlay */}
              {!isPlaying && (
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                  <Button
                    size="lg"
                    onClick={togglePlay}
                    className="rounded-full h-16 w-16 bg-white text-primary hover:bg-gray-100"
                  >
                    <Play className="h-8 w-8 ml-1" />
                  </Button>
                </div>
              )}

              {/* Progress Bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-300">
                <div 
                  className="h-full bg-primary transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Content Area */}
            <div className="p-6 flex flex-col justify-between">
              <div className="space-y-6">
                {/* Step Info */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <currentStepData.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <Badge variant="secondary">
                        Step {currentStep + 1} of {demoSteps.length}
                      </Badge>
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900">
                    {currentStepData.title}
                  </h3>
                  
                  <p className="text-lg text-gray-600 leading-relaxed">
                    {currentStepData.description}
                  </p>
                </div>

                {/* Feature Highlights */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Key Features:</h4>
                  <div className="space-y-2">
                    {currentStep === 0 && (
                      <>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span>Custom store handle (yourname.creohub.com)</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span>Mobile-optimized design</span>
                        </div>
                      </>
                    )}
                    {currentStep === 1 && (
                      <>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span>Digital downloads & physical products</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span>Automated file delivery</span>
                        </div>
                      </>
                    )}
                    {currentStep === 3 && (
                      <>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span>M-Pesa, Cards, Bank Transfers</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span>Multi-currency support</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="space-y-4">
                {/* Navigation */}
                <div className="flex items-center justify-center space-x-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    onClick={togglePlay}
                    className="px-6"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Play
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={nextStep}
                    disabled={currentStep === demoSteps.length - 1}
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>

                {/* Step Indicators */}
                <div className="flex items-center justify-center space-x-2">
                  {demoSteps.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentStep(index);
                        setProgress(0);
                      }}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        index === currentStep 
                          ? 'bg-primary' 
                          : index < currentStep 
                          ? 'bg-green-500' 
                          : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>

                {/* CTA */}
                <div className="text-center pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-3">
                    Ready to start your creator journey?
                  </p>
                  <Button onClick={onClose} className="w-full">
                    Start Your Free Store
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}