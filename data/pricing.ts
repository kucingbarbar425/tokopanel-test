// Pricing configuration for custom RAM and CPU selection
export const pricingConfig = {
  basePrice: 0, // Base price for panel
  
  ram: {
    // RAM in GB to MB conversion
    // Price per GB per month
    pricePerGB: 1000,
    minGB: 1,
    maxGB: 16,
    step: 0.5,
  },
  
  cpu: {
    // Price per 10% CPU allocation
    pricePerPercent: 50,
    minPercent: 10,
    maxPercent: 400,
    step: 10,
  },
  
  disk: {
    // Disk space is included with RAM
    // 1GB RAM = 1GB Disk included
    // Additional disk can be added at this rate
    pricePerGB: 500,
    maxGB: 100,
  },

  duration: {
    // Duration in months
    months: 1,
  },
}

// Calculate total price based on selected RAM and CPU
export function calculateCustomPrice(ramGB: number, cpuPercent: number): number {
  const { basePrice, ram: ramConfig, cpu: cpuConfig } = pricingConfig
  
  const ramPrice = ramGB * ramConfig.pricePerGB
  const cpuPrice = cpuPercent * cpuConfig.pricePerPercent
  
  return basePrice + ramPrice + cpuPrice
}

// Validate specs
export function validateSpecs(ramGB: number, cpuPercent: number): { valid: boolean; error?: string } {
  const { ram: ramConfig, cpu: cpuConfig } = pricingConfig
  
  if (ramGB < ramConfig.minGB || ramGB > ramConfig.maxGB) {
    return {
      valid: false,
      error: `RAM harus antara ${ramConfig.minGB}GB - ${ramConfig.maxGB}GB`,
    }
  }
  
  if (cpuPercent < cpuConfig.minPercent || cpuPercent > cpuConfig.maxPercent) {
    return {
      valid: false,
      error: `CPU harus antara ${cpuConfig.minPercent}% - ${cpuConfig.maxPercent}%`,
    }
  }
  
  return { valid: true }
}
