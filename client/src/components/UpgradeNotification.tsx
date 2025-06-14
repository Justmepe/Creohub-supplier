import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Sparkles, Crown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface UpgradeNotificationProps {
  planType: "starter" | "pro" | null;
  onClose: () => void;
}

export default function UpgradeNotification({ planType, onClose }: UpgradeNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (planType) {
      setIsVisible(true);
      // Auto-hide after 8 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation to complete
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [planType, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  if (!planType) return null;

  const planConfig = {
    starter: {
      icon: Zap,
      title: "Welcome to Starter! 🚀",
      subtitle: "You're now part of the creator economy",
      color: "from-blue-500 to-purple-600",
      benefits: ["5% transaction fee", "Priority support", "Advanced analytics"]
    },
    pro: {
      icon: Crown,
      title: "Welcome to Pro! 👑",
      subtitle: "You've unlocked maximum earning potential",
      color: "from-purple-600 to-pink-600",
      benefits: ["0% transaction fees", "VIP support", "Premium features", "Custom branding"]
    }
  };

  const config = planConfig[planType];
  const IconComponent = config.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 100 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 100 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 20,
            duration: 0.6
          }}
          className="fixed bottom-6 right-6 z-50 max-w-sm"
        >
          <Card className="relative overflow-hidden border-0 shadow-2xl">
            {/* Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${config.color} opacity-90`} />
            
            {/* Sparkle Animation */}
            <div className="absolute inset-0">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ 
                    opacity: [0, 1, 0], 
                    scale: [0, 1, 0],
                    rotate: [0, 180, 360]
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.2,
                    repeat: Infinity,
                    repeatDelay: 1
                  }}
                  style={{
                    left: `${20 + i * 15}%`,
                    top: `${10 + i * 10}%`
                  }}
                >
                  <Sparkles className="w-3 h-3 text-white/60" />
                </motion.div>
              ))}
            </div>

            {/* Content */}
            <div className="relative p-6 text-white">
              {/* Close Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="absolute top-2 right-2 text-white/80 hover:text-white hover:bg-white/20 w-8 h-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>

              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1
                  }}
                  className="p-2 bg-white/20 rounded-full"
                >
                  <IconComponent className="w-6 h-6" />
                </motion.div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">
                    {config.title}
                  </h3>
                  <p className="text-sm text-white/90">
                    {config.subtitle}
                  </p>
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-2 mb-4">
                {config.benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-center gap-2"
                  >
                    <Check className="w-4 h-4 text-green-300" />
                    <span className="text-sm text-white/90">{benefit}</span>
                  </motion.div>
                ))}
              </div>

              {/* Action Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Button
                  onClick={handleClose}
                  className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                  variant="outline"
                >
                  Start Creating
                </Button>
              </motion.div>
            </div>

            {/* Pulse Effect */}
            <motion.div
              className={`absolute inset-0 bg-gradient-to-br ${config.color} opacity-30`}
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.3, 0.1, 0.3]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}