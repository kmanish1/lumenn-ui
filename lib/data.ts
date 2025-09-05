export const options = [
  { value: "never", label: "Never" },
  { value: "1h", label: "1 Hour" },
  { value: "6h", label: "6 Hours" },
  { value: "24h", label: "24 Hours" },
  { value: "7d", label: "7 Days" },
  { value: "custom", label: "Custom" },
];

export const EXPIRY_OFFSETS: { [key: string]: number } = {
  never: 0,
  "1h": 3600,
  "6h": 6 * 3600,
  "24h": 24 * 3600,
  "7d": 7 * 24 * 3600,
  custom: 0, // For 'custom', wait for user to pick a date
};
