// Test script for automated feeding system
import automatedFeedingService from "./AnimalManagement/services/automatedFeedingService.js";

console.log("🧪 Testing Automated Feeding System...");

// Test 1: Check service status
console.log("\n1. Service Status:");
const status = automatedFeedingService.getStatus();
console.log("Status:", status);

// Test 2: Get next scheduled feeding
console.log("\n2. Next Scheduled Feeding:");
try {
  const nextFeeding = await automatedFeedingService.getNextScheduledFeeding();
  if (nextFeeding) {
    console.log("Next feeding found:");
    console.log("- Zone:", nextFeeding.zoneId?.name || "Unknown");
    console.log("- Feed:", nextFeeding.foodId?.name || "Unknown");
    console.log("- Quantity:", nextFeeding.quantity + "g");
    console.log("- Time:", new Date(nextFeeding.feedingTime).toLocaleString());
    console.log("- Status:", nextFeeding.status || "scheduled");
  } else {
    console.log("No scheduled feedings found");
  }
} catch (error) {
  console.error("Error getting next feeding:", error);
}

// Test 3: Manual check
console.log("\n3. Manual Check:");
try {
  await automatedFeedingService.checkScheduledFeedings();
  console.log("Manual check completed");
} catch (error) {
  console.error("Error in manual check:", error);
}

console.log("\n✅ Test completed!");
