import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Zap, X, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface SocialProofData {
  name: string;
  location: string;
  plan: "starter" | "pro";
  timeAgo: string;
}

// Demo data - will be replaced with real subscriber data later
const demoUpgrades: SocialProofData[] = [
  { name: "David", location: "Nairobi", plan: "pro", timeAgo: "just now" },
  { name: "Sarah", location: "Lagos", plan: "starter", timeAgo: "2 minutes ago" },
  { name: "Michael", location: "Accra", plan: "pro", timeAgo: "5 minutes ago" },
  { name: "Amina", location: "Kampala", plan: "starter", timeAgo: "8 minutes ago" },
  { name: "James", location: "Dar es Salaam", plan: "pro", timeAgo: "12 minutes ago" },
  { name: "Grace", location: "Kigali", plan: "starter", timeAgo: "15 minutes ago" },
  { name: "Peter", location: "Addis Ababa", plan: "pro", timeAgo: "18 minutes ago" },
  { name: "Faith", location: "Lusaka", plan: "starter", timeAgo: "22 minutes ago" },
  { name: "Samuel", location: "Harare", plan: "pro", timeAgo: "25 minutes ago" },
  { name: "Mary", location: "Douala", plan: "starter", timeAgo: "28 minutes ago" },
];

export default function SocialProofNotification() {
  const [currentUpgrade, setCurrentUpgrade] = useState<SocialProofData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [upgradeIndex, setUpgradeIndex] = useState(0);

  useEffect(() => {
    const showNotification = () => {
      const upgrade = demoUpgrades[upgradeIndex];
      setCurrentUpgrade(upgrade);
      setIsVisible(true);

      // Hide after 4 seconds
      setTimeout(() => {
        setIsVisible(false);
      }, 4000);

      // Move to next upgrade
      setUpgradeIndex((prev) => (prev + 1) % demoUpgrades.length);
    };

    // Show first notification after 3 seconds
    const initialTimer = setTimeout(showNotification, 3000);

    // Then show every 12 seconds
    const interval = setInterval(showNotification, 12000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [upgradeIndex]);

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!currentUpgrade) return null;

  const planConfig = {
    starter: {
      icon: Zap,
      color: "bg-blue-500",
      text: "Starter Plan",
      gradient: "from-blue-500 to-blue-600"
    },
    pro: {
      icon: Crown,
      color: "bg-purple-500",
      text: "Pro Plan", 
      gradient: "from-purple-500 to-purple-600"
    }
  };

  const config = planConfig[currentUpgrade.plan];
  const IconComponent = config.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: -100, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -100, scale: 0.8 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 25,
            duration: 0.5
          }}
          className="fixed bottom-6 left-6 z-50 max-w-xs"
        >
          <Card className="relative overflow-hidden border border-gray-200 dark:border-gray-700 shadow-xl bg-white dark:bg-gray-800">
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>

            <div className="p-4">
              {/* User info */}
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className={`text-white text-sm font-medium bg-gradient-to-br ${config.gradient}`}>
                    {currentUpgrade.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {currentUpgrade.name}
                    </p>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className={`p-1 rounded-full ${config.color}`}
                    >
                      <IconComponent className="w-3 h-3 text-white" />
                    </motion.div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {currentUpgrade.location}
                  </p>
                </div>
              </div>

              {/* Upgrade message */}
              <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                <span>Just upgraded to </span>
                <span className={`font-semibold text-transparent bg-clip-text bg-gradient-to-r ${config.gradient}`}>
                  {config.text}
                </span>
              </div>

              {/* Time stamp */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {currentUpgrade.timeAgo}
                </span>
                <div className="flex items-center gap-1">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-2 h-2 bg-green-500 rounded-full"
                  />
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                    Live
                  </span>
                </div>
              </div>
            </div>

            {/* Animated border */}
            <motion.div
              className={`absolute inset-0 opacity-20 bg-gradient-to-r ${config.gradient}`}
              animate={{
                opacity: [0.1, 0.3, 0.1]
              }}
              transition={{
                duration: 2,
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