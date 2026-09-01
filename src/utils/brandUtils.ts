/**
 * Brand & Workspace Name formatting utilities.
 * Ensures that tenant workspace labels display the tenant's actual company name cleanly
 * without enforcing any default 'ARCLE' or 'ARCLE - ' branding for tenants.
 */

export function formatArcleName(
  baseName: string = 'Workspace',
  companyName?: string | null
): string {
  const cleanCompany = (companyName || '')
    .replace(/^ARCLE\s*[-–|:•]\s*/i, '')
    .replace(/^ARCLE\s+/i, '')
    .trim();

  if (cleanCompany) {
    return cleanCompany;
  }

  const cleanBase = (baseName || '')
    .replace(/^ARCLE\s*[-–|:•]\s*/i, '')
    .replace(/^ARCLE\s+/i, '')
    .trim();

  return cleanBase || 'Workspace';
}
