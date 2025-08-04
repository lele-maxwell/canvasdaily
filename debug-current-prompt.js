const fs = require('fs');
const path = require('path');

// Read the scheduling config
const configPath = path.join(process.cwd(), '.scheduling-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

console.log('=== SCHEDULING DEBUG ===');
console.log('Current Time:', new Date().toISOString());
console.log('Base Time:', config.baseTime);
console.log('Interval Minutes:', config.intervalMinutes);
console.log('Is Active:', config.isActive);
console.log('');

// Calculate current prompt logic (same as in scheduling-config.ts)
const baseTime = new Date(config.baseTime);
const now = new Date();
const timeDiff = now.getTime() - baseTime.getTime();
const intervalMs = config.intervalMinutes * 60 * 1000;
const intervalsPassed = Math.floor(timeDiff / intervalMs);

console.log('=== CALCULATION DETAILS ===');
console.log('Time Difference (ms):', timeDiff);
console.log('Time Difference (minutes):', Math.floor(timeDiff / (60 * 1000)));
console.log('Interval Duration (ms):', intervalMs);
console.log('Intervals Passed:', intervalsPassed);
console.log('');

// Simulate with different prompt counts
const promptCounts = [3, 5, 10];
promptCounts.forEach(totalPrompts => {
  const promptIndex = intervalsPassed % totalPrompts;
  const currentIntervalStart = new Date(baseTime.getTime() + (intervalsPassed * intervalMs));
  const currentIntervalEnd = new Date(currentIntervalStart.getTime() + intervalMs);
  console.log(`=== WITH ${totalPrompts} PROMPTS ===`);
  console.log('Prompt Index:', promptIndex);
  console.log('Current Interval Start:', currentIntervalStart.toISOString());
  console.log('Current Interval End:', currentIntervalEnd.toISOString());
  console.log('');
});

console.log('=== NEXT INTERVALS ===');
for (let i = 0; i < 3; i++) {
  const nextInterval = intervalsPassed + i + 1;
  const nextStart = new Date(baseTime.getTime() + (nextInterval * intervalMs));
  console.log(`Interval ${nextInterval}: ${nextStart.toISOString()}`);
}
  