import { db } from "../db";
import { subscriptions, users, creators } from "../../shared/schema";
import { eq, desc, and, gte, isNotNull } from "drizzle-orm";

interface SocialProofData {
  name: string;
  location: string;
  plan: "starter" | "pro";
  timeAgo: string;
}

// Demo data for when no real upgrades are available
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
  { name: "Daniel", location: "Cape Town", plan: "pro", timeAgo: "30 minutes ago" },
  { name: "Rebecca", location: "Tunis", plan: "starter", timeAgo: "35 minutes ago" },
  { name: "Joseph", location: "Casablanca", plan: "pro", timeAgo: "40 minutes ago" },
  { name: "Fatima", location: "Abuja", plan: "starter", timeAgo: "45 minutes ago" },
  { name: "Emmanuel", location: "Accra", plan: "pro", timeAgo: "50 minutes ago" },
];

// African cities for location assignment
const africanCities = [
  "Nairobi", "Lagos", "Accra", "Kampala", "Dar es Salaam", "Kigali", 
  "Addis Ababa", "Lusaka", "Harare", "Douala", "Cape Town", "Tunis",
  "Casablanca", "Abuja", "Kinshasa", "Luanda", "Maputo", "Gaborone",
  "Windhoek", "Lilongwe", "Bamako", "Ouagadougou", "Dakar", "Conakry"
];

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return "just now";
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
}

function getRandomCity(): string {
  return africanCities[Math.floor(Math.random() * africanCities.length)];
}

export async function getSocialProofData(): Promise<SocialProofData[]> {
  try {
    // Try to get real subscription data from the last 7 days
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const realUpgrades = await db
      .select({
        userName: users.username,
        fullName: users.fullName,
        planType: subscriptions.planType,
        createdAt: subscriptions.createdAt,
      })
      .from(subscriptions)
      .innerJoin(users, eq(subscriptions.creatorId, users.id))
      .where(
        and(
          gte(subscriptions.createdAt, oneWeekAgo),
          isNotNull(subscriptions.createdAt)
        )
      )
      .orderBy(desc(subscriptions.createdAt))
      .limit(20);

    // Transform real data to social proof format
    const realSocialProof: SocialProofData[] = realUpgrades.map(upgrade => ({
      name: upgrade.fullName?.split(' ')[0] || upgrade.userName,
      location: getRandomCity(), // Random city since we don't collect user location
      plan: upgrade.planType as "starter" | "pro",
      timeAgo: getTimeAgo(upgrade.createdAt || new Date())
    }));

    // If we have real data, mix it with some demo data to ensure consistent flow
    if (realSocialProof.length > 0) {
      // Mix real and demo data (70% real, 30% demo)
      const mixedData = [...realSocialProof];
      const demoCount = Math.max(3, Math.floor(realSocialProof.length * 0.3));
      const shuffledDemo = [...demoUpgrades].sort(() => Math.random() - 0.5);
      
      for (let i = 0; i < demoCount && i < shuffledDemo.length; i++) {
        mixedData.splice(
          Math.floor(Math.random() * mixedData.length),
          0,
          shuffledDemo[i]
        );
      }
      
      return mixedData.slice(0, 15); // Return max 15 items
    }

    // Fallback to demo data if no real upgrades
    return demoUpgrades;
    
  } catch (error) {
    console.error("Error fetching social proof data:", error);
    // Fallback to demo data on error
    return demoUpgrades;
  }
}

export async function addFakeUser(userData: {
  name: string;
  location: string;
  plan: "starter" | "pro";
}): Promise<boolean> {
  try {
    // Add to demo data array (in production, you might want to store in database)
    const newUpgrade: SocialProofData = {
      name: userData.name,
      location: userData.location,
      plan: userData.plan,
      timeAgo: "just now"
    };
    
    demoUpgrades.unshift(newUpgrade);
    
    // Keep only last 20 demo upgrades
    if (demoUpgrades.length > 20) {
      demoUpgrades.pop();
    }
    
    return true;
  } catch (error) {
    console.error("Error adding fake user:", error);
    return false;
  }
}

// Configuration for switching between real and demo data
export const socialProofConfig = {
  useRealData: true, // Set to false to use only demo data
  minRealDataRequired: 5, // Minimum real upgrades needed before using real data
  mixRatio: 0.7, // 70% real data, 30% demo when mixing
};