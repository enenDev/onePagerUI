import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Define role hierarchy
const ROLE_HIERARCHY = {
  CSP: 3, // Highest
  CBD: 2, // Second
  GENERAL: 1, // Lowest (default)
};

// Utility function to get highest privilege role
export function getHighestPrivilegeRole(
  role: string | string[] | undefined,
): string {
  // Normalize to array
  const roles = Array.isArray(role) ? role : role ? [role] : [];

  if (roles.length === 0) {
    return "GENERAL";
  }

  // Convert to uppercase for comparison
  const upperRoles = roles.map((r) => r.toUpperCase());

  // Find role with highest priority
  const highestRole = upperRoles.reduce((highest, current) => {
    const currentPriority =
      ROLE_HIERARCHY[current as keyof typeof ROLE_HIERARCHY] || 0;
    const highestPriority =
      ROLE_HIERARCHY[highest as keyof typeof ROLE_HIERARCHY] || 0;

    return currentPriority > highestPriority ? current : highest;
  });

  return highestRole || "GENERAL";
}
