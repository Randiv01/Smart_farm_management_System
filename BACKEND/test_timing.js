// Test script for timing improvements
console.log("🧪 Testing Automated Feeding Timing...");

// Test countdown calculation
function testCountdown() {
  const now = new Date();
  const futureTime = new Date(now.getTime() + 30000); // 30 seconds from now
  
  console.log("Current time:", now.toLocaleString());
  console.log("Future time:", futureTime.toLocaleString());
  
  const timeDiff = futureTime.getTime() - now.getTime();
  const seconds = Math.floor(timeDiff / 1000);
  
  console.log("Time difference:", seconds, "seconds");
  console.log("Should trigger when <= 15 seconds remaining");
}

// Test timing logic
function testTimingLogic() {
  const now = new Date();
  const testTimes = [
    new Date(now.getTime() + 5000),   // 5 seconds
    new Date(now.getTime() + 10000),  // 10 seconds
    new Date(now.getTime() + 15000),  // 15 seconds
    new Date(now.getTime() + 20000),  // 20 seconds
  ];
  
  console.log("\nTesting timing logic:");
  testTimes.forEach((time, index) => {
    const timeDiff = time.getTime() - now.getTime();
    const shouldTrigger = timeDiff <= 15000; // 15 seconds
    console.log(`Test ${index + 1}: ${Math.floor(timeDiff/1000)}s - Should trigger: ${shouldTrigger}`);
  });
}

testCountdown();
testTimingLogic();

console.log("\n✅ Timing tests completed!");
