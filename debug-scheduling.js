const fs = require('fs');
const path = require('path');

// Read scheduling config
function readConfig() {
  const configPath = path.join(process.cwd(), '.scheduling-config.json');
  try {
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('Error reading config:', error);
  }
  return null;
}

// Calculate current prompt
function calculateCurrentPrompt(totalPrompts, config) {
  if (totalPrompts === 0) {
    return { promptIndex: -1, reason: 'No prompts available' };
  }

  const baseTime = new Date(config.baseTime);
  const now = new Date();
  
  console.log('🕐 Current time:', now.toISOString());
  console.log('🕐 Base time:', baseTime.toISOString());
  
  // Calculate how many intervals have passed since base time
  const timeDiff = now.getTime() - baseTime.getTime();
  const intervalMs = config.intervalMinutes * 60 * 1000;
  const intervalsPassed = Math.floor(timeDiff / intervalMs);
  
  console.log('⏱️ Time difference (ms):', timeDiff);
  console.log('⏱️ Interval length (ms):', intervalMs);
  console.log('⏱️ Intervals passed:', intervalsPassed);
  
  // Use modulo to cycle through prompts
  const promptIndex = intervalsPassed % totalPrompts;
  
  console.log('🔢 Raw prompt index:', promptIndex);
  console.log('🔢 Final prompt index:', Math.max(0, promptIndex));
  
  // Calculate current interval boundaries
  const currentIntervalStart = new Date(baseTime.getTime() + (intervalsPassed * intervalMs));
  const currentIntervalEnd = new Date(currentIntervalStart.getTime() + intervalMs);
  
  console.log('📅 Current interval start:', currentIntervalStart.toISOString());
  console.log('📅 Current interval end:', currentIntervalEnd.toISOString());
  
  return {
    promptIndex: Math.max(0, promptIndex),
    currentIntervalStart,
    currentIntervalEnd,
    intervalsPassed,
    timeDiff
  };
}

async function debugScheduling() {
  console.log('🔍 Debugging scheduling system...\n');
  
  // Read config
  const config = readConfig();
  if (!config) {
    console.log('❌ No scheduling config found');
    return;
  }
  
  console.log('⚙️ Scheduling config:');
  console.log('   - Interval minutes:', config.intervalMinutes);
  console.log('   - Base time:', config.baseTime);
  console.log('   - Is active:', config.isActive);
  console.log('');
  
  if (!config.isActive) {
    console.log('❌ Scheduling is not active');
    return;
  }
  
  // Test with 4 prompts (assuming we have 4)
  const totalPrompts = 4;
  console.log('🎯 Testing with', totalPrompts, 'prompts\n');
  
  const result = calculateCurrentPrompt(totalPrompts, config);
  
  console.log('\n📊 Result:');
  console.log('   - Prompt index:', result.promptIndex);
  console.log('   - Should show prompt:', result.promptIndex + 1, 'of', totalPrompts);
  
  if (result.promptIndex >= 0) {
    console.log('✅ Valid prompt found!');
  } else {
    console.log('❌ No valid prompt (index is negative)');
  }
}

debugScheduling();