import fs from 'fs';
import path from 'path';

// Scheduling configuration management
interface SchedulingConfig {
  intervalMinutes: number;
  baseTime: string;
  isActive: boolean;
}

// Default configuration
const DEFAULT_CONFIG: SchedulingConfig = {
  intervalMinutes: 2, // 2 minutes for testing, 1440 for production (24 hours)
  baseTime: new Date().toISOString(),
  isActive: false
};

// Configuration file path
const CONFIG_FILE_PATH = path.join(process.cwd(), '.scheduling-config.json');

// Helper function to read config from file
function readConfigFromFile(): SchedulingConfig {
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const fileContent = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
      const config = JSON.parse(fileContent);
      return { ...DEFAULT_CONFIG, ...config };
    }
  } catch (error) {
    console.warn('Failed to read scheduling config file:', error);
  }
  return { ...DEFAULT_CONFIG };
}

// Helper function to write config to file
function writeConfigToFile(config: SchedulingConfig): void {
  try {
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('Failed to write scheduling config file:', error);
  }
}

export function getSchedulingConfig(): SchedulingConfig {
  return readConfigFromFile();
}

export function updateSchedulingConfig(newConfig: Partial<SchedulingConfig>): SchedulingConfig {
  const currentConfig = readConfigFromFile();
  const updatedConfig = { ...currentConfig, ...newConfig };
  writeConfigToFile(updatedConfig);
  return updatedConfig;
}

export function resetSchedulingConfig(): SchedulingConfig {
  writeConfigToFile(DEFAULT_CONFIG);
  return { ...DEFAULT_CONFIG };
}

// Calculate current prompt based on configuration
export function calculateCurrentPrompt(totalPrompts: number): {
  promptIndex: number;
  currentIntervalStart: Date;
  currentIntervalEnd: Date;
} {
  if (totalPrompts === 0) {
    const now = new Date();
    return {
      promptIndex: -1,
      currentIntervalStart: now,
      currentIntervalEnd: now
    };
  }

  const config = getSchedulingConfig();
  const baseTime = new Date(config.baseTime);
  const now = new Date();
  
  // Calculate how many intervals have passed since base time
  const timeDiff = now.getTime() - baseTime.getTime();
  const intervalMs = config.intervalMinutes * 60 * 1000;
  const intervalsPassed = Math.floor(timeDiff / intervalMs);
  
  // Use modulo to cycle through prompts
  const promptIndex = intervalsPassed % totalPrompts;
  
  // Calculate current interval boundaries
  const currentIntervalStart = new Date(baseTime.getTime() + (intervalsPassed * intervalMs));
  const currentIntervalEnd = new Date(currentIntervalStart.getTime() + intervalMs);
  
  return {
    promptIndex: Math.max(0, promptIndex),
    currentIntervalStart,
    currentIntervalEnd
  };
}