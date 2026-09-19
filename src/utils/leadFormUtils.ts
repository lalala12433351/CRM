export interface FormCampaignInfo {
  formName: string;
  formId: string;
  handle: string;
  source: string;
  regionTag?: string;
}

/**
 * Extracts a normalized Form / Campaign / Region Name from any lead object regardless of integration source
 * (Meta Facebook Lead Ads, Webhooks, JustDial, Google Ads, IndiaMART, Manual Forms)
 */
export function getLeadFormOrCampaignName(lead: any): string {
  if (!lead) return 'General Inbound';

  // 1. Direct Campaign Name or Handle specified by user
  const custom = lead.customFields || {};
  if (lead.campaignName && lead.campaignName.trim()) return lead.campaignName.trim();
  if (lead.campaign_handle && lead.campaign_handle.trim()) return lead.campaign_handle.trim();
  if (lead.campaign && lead.campaign.trim()) return lead.campaign.trim();
  if (custom.campaign_name && custom.campaign_name.trim()) return custom.campaign_name.trim();
  if (custom.campaign_handle && custom.campaign_handle.trim()) return custom.campaign_handle.trim();
  if (custom.campaignName && custom.campaignName.trim()) return custom.campaignName.trim();

  // 2. Direct Form Names
  if (lead.formName && lead.formName.trim()) return lead.formName.trim();
  if (lead.form_name && lead.form_name.trim()) return lead.form_name.trim();
  if (custom.form_name && custom.form_name.trim()) return custom.form_name.trim();
  if (custom.meta_form_name && custom.meta_form_name.trim()) return custom.meta_form_name.trim();
  if (custom.formName && custom.formName.trim()) return custom.formName.trim();

  // 3. Scan tags for form/@handle or region tags (e.g., @master-form--bangalore--hindi, karnataka-22-08-2025, Karnataka, North India)
  if (Array.isArray(lead.tags) && lead.tags.length > 0) {
    const formTag = lead.tags.find((t: string) => 
      t.startsWith('@') || 
      t.toLowerCase().includes('form') || 
      t.toLowerCase().includes('karnataka') ||
      t.toLowerCase().includes('india') ||
      t.toLowerCase().includes('bangalore') ||
      t.toLowerCase().includes('delhi') ||
      t.toLowerCase().includes('mumbai') ||
      t.toLowerCase().includes('tamil') ||
      t.toLowerCase().includes('kerala') ||
      t.toLowerCase().includes('hyderabad')
    );
    if (formTag) {
      return formTag.replace(/^@/, '').trim();
    }
  }

  // 4. Scan notes for Form metadata
  if (lead.notes && typeof lead.notes === 'string') {
    const formMatch = lead.notes.match(/Form:\s*([^,\)\n]+)/i);
    if (formMatch && formMatch[1] && formMatch[1].trim() !== 'N/A') {
      return formMatch[1].trim();
    }
  }

  // 5. Source or Company platform fallbacks
  if (lead.source && !lead.source.includes('Manual Entry')) {
    return lead.source.trim();
  }
  if (lead.company && lead.company !== 'N/A') {
    return lead.company.trim();
  }

  return 'General Inbound';
}

/**
 * Converts a campaign or form display name into a clean handle.
 * Always normalizes, including strings that already start with `@`,
 * so `@no-otp-form---andra` and `no-otp-form---andra` become the same handle.
 */
export function formatCampaignHandle(name: string): string {
  if (!name) return '@general';
  const withoutAt = String(name).trim().replace(/^@+/, '');
  const clean = withoutAt
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return clean ? `@${clean}` : '@general';
}
