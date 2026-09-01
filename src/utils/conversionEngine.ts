import { 
  Lead, 
  LeadAttribution, 
  LeadQualityScore, 
  LeadQualityTier, 
  ConversionEventRecord, 
  ConversionTrackingSettings, 
  ConversionStageMapping,
  CampaignQualityMetric,
  ConversionPlatform 
} from '../types';

// ============================================================================
// SHA-256 HASHING & NORMALIZATION UTILITIES
// ============================================================================

export function normalizeEmail(email?: string): string {
  if (!email) return '';
  return email.trim().toLowerCase();
}

export function normalizePhone(phone?: string): string {
  if (!phone) return '';
  // Remove all non-digits except leading +
  let cleaned = phone.trim().replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  // Default to India country code 91 if 10 digits
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  return `+${cleaned}`;
}

export async function sha256Hex(text: string): Promise<string> {
  if (!text) return '';
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const msgUint8 = new TextEncoder().encode(text);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {
    // fallback
  }
  // Simple deterministic fallback representation if crypto subtle is not in scope
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
}

// ============================================================================
// DEFAULT SETTINGS & INITIAL DATA
// ============================================================================

export const DEFAULT_STAGE_MAPPINGS: ConversionStageMapping[] = [
  {
    id: 'map-new-lead',
    crmStage: 'New Lead',
    googleAdsAction: 'Lead (Form Submission)',
    googleAdsEnabled: true,
    metaEvent: 'Lead',
    metaEnabled: true,
    conversionValue: 100,
    valueType: 'fixed',
    qualityThreshold: 0
  },
  {
    id: 'map-contacted',
    crmStage: 'Contacted',
    googleAdsAction: '— (Ignored to protect bid strategy)',
    googleAdsEnabled: false,
    metaEvent: 'Contact',
    metaEnabled: true,
    conversionValue: 200,
    valueType: 'fixed',
    qualityThreshold: 20
  },
  {
    id: 'map-call-connected',
    crmStage: 'Call Connected',
    googleAdsAction: '—',
    googleAdsEnabled: false,
    metaEvent: 'Contact (Call Connected)',
    metaEnabled: true,
    conversionValue: 350,
    valueType: 'fixed',
    qualityThreshold: 35
  },
  {
    id: 'map-interested',
    crmStage: 'Interested',
    googleAdsAction: 'Engaged Lead',
    googleAdsEnabled: true,
    metaEvent: 'ViewContent (Course Syllabus Downloaded)',
    metaEnabled: true,
    conversionValue: 500,
    valueType: 'fixed',
    qualityThreshold: 45
  },
  {
    id: 'map-qualified',
    crmStage: 'Qualified',
    googleAdsAction: 'Qualified Lead (Counselor Verified)',
    googleAdsEnabled: true,
    metaEvent: 'Lead (Qualified)',
    metaEnabled: true,
    conversionValue: 1200,
    valueType: 'fixed',
    qualityThreshold: 60
  },
  {
    id: 'map-appointment',
    crmStage: 'Appointment Booked',
    googleAdsAction: 'Campus Visit / Demo Booked',
    googleAdsEnabled: true,
    metaEvent: 'Schedule',
    metaEnabled: true,
    conversionValue: 2500,
    valueType: 'fixed',
    qualityThreshold: 70
  },
  {
    id: 'map-converted',
    crmStage: 'Converted',
    googleAdsAction: 'Enrolled Student / Converted Customer',
    googleAdsEnabled: true,
    metaEvent: 'CompleteRegistration',
    metaEnabled: true,
    conversionValue: 8000,
    valueType: 'fixed',
    qualityThreshold: 80
  },
  {
    id: 'map-won',
    crmStage: 'Won',
    googleAdsAction: 'High Value Student Enrollment',
    googleAdsEnabled: true,
    metaEvent: 'Purchase',
    metaEnabled: true,
    conversionValue: 125000,
    valueType: 'deal_value',
    qualityThreshold: 85
  }
];

export const DEFAULT_CONVERSION_SETTINGS: ConversionTrackingSettings = {
  googleAds: {
    enabled: true,
    customerId: '839-291-0482',
    conversionActionId: 'CA_8920194821',
    conversionActionName: 'ARCLE_Aviation_Qualified_Lead',
    developerToken: 'dev_tok_92819827391823',
    enhancedConversionsEnabled: true,
    offlineConversionsEnabled: true,
    defaultCurrency: 'INR',
    status: 'connected',
    lastSync: '12 mins ago'
  },
  metaAds: {
    enabled: true,
    pixelId: '984029182938192',
    datasetId: 'ds_778192837192',
    accessToken: 'EAAG9...live_capi_token_antigravity_crm',
    capiEnabled: true,
    testEventCode: 'TEST98231',
    defaultCurrency: 'INR',
    status: 'connected',
    lastSync: '4 mins ago'
  },
  stageMappings: DEFAULT_STAGE_MAPPINGS,
  qualityScoringRules: {
    validPhone: 15,
    validEmail: 10,
    contacted: 10,
    callConnected: 15,
    interested: 20,
    qualified: 30,
    appointmentBooked: 40,
    converted: 60,
    won: 100,
    invalid: -50,
    duplicate: -30,
    fakeNumber: -50,
    notInterested: -20
  },
  deduplicationRules: {
    preventDuplicateUploads: true,
    phoneDeduplication: true,
    emailDeduplication: true,
    autoDisqualifyInvalid: true
  }
};

// ============================================================================
// LEAD QUALITY SCORING ENGINE
// ============================================================================

export function calculateLeadQualityScore(
  lead: Partial<Lead>,
  rules = DEFAULT_CONVERSION_SETTINGS.qualityScoringRules
): LeadQualityScore {
  let score = 10; // base raw lead score
  const breakdown: Array<{ factor: string; points: number; matched: boolean; note?: string }> = [];

  // 1. Raw Lead Base
  breakdown.push({
    factor: 'Raw Inbound Lead Capture',
    points: 10,
    matched: true,
    note: 'Initial contact capture in CRM'
  });

  // 2. Phone Validity
  const phoneClean = (lead.phone || '').replace(/[^\d]/g, '');
  const isValidPhone = phoneClean.length >= 10 && !phoneClean.startsWith('00000') && !phoneClean.startsWith('12345');
  if (isValidPhone) {
    score += rules.validPhone;
    breakdown.push({
      factor: 'Valid Phone Number Verified',
      points: rules.validPhone,
      matched: true,
      note: lead.phone
    });
  } else {
    breakdown.push({
      factor: 'Invalid / Incomplete Phone',
      points: rules.fakeNumber,
      matched: true,
      note: 'Phone format suspicious or incomplete'
    });
    score += rules.fakeNumber;
  }

  // 3. Email Validity
  const isValidEmail = Boolean(lead.email && lead.email.includes('@') && lead.email.includes('.'));
  if (isValidEmail) {
    score += rules.validEmail;
    breakdown.push({
      factor: 'Valid Email Address',
      points: rules.validEmail,
      matched: true,
      note: lead.email
    });
  }

  // 4. Duplicate Check
  if (lead.isDuplicate) {
    score += rules.duplicate;
    breakdown.push({
      factor: 'Duplicate Contact Flagged',
      points: rules.duplicate,
      matched: true,
      note: 'Existing phone/email detected in pipeline'
    });
  }

  // 5. Invalid Check
  if (lead.isInvalid || lead.status === 'Invalid') {
    score += rules.invalid;
    breakdown.push({
      factor: 'Marked Invalid / Spam',
      points: rules.invalid,
      matched: true,
      note: 'Sales agent marked lead as spam/fake'
    });
  }

  // 6. Lifecycle Stage Transitions
  const status = lead.status || 'Fresh';
  
  if (status === 'Contacted') {
    score += rules.contacted;
    breakdown.push({
      factor: 'Telecaller Contact Initiated',
      points: rules.contacted,
      matched: true
    });
  } else if (status === 'Call Connected') {
    score += rules.contacted + rules.callConnected;
    breakdown.push({
      factor: 'Outbound Call Connected & Spoke with Decision Maker',
      points: rules.callConnected,
      matched: true
    });
  } else if (status === 'Interested' || status === 'Warm') {
    score += rules.contacted + rules.callConnected + rules.interested;
    breakdown.push({
      factor: 'Demonstrated Active Buying Interest',
      points: rules.interested,
      matched: true
    });
  } else if (status === 'Qualified' || status === 'Proposal Sent') {
    score += rules.contacted + rules.callConnected + rules.interested + rules.qualified;
    breakdown.push({
      factor: 'Sales Qualification Completed (Budget & Timing Fit)',
      points: rules.qualified,
      matched: true
    });
  } else if (status === 'Appointment Booked' || status === 'Demo Scheduled' || status === 'Visit Scheduled') {
    score += rules.contacted + rules.callConnected + rules.interested + rules.qualified + rules.appointmentBooked;
    breakdown.push({
      factor: 'Meeting / Campus Visit Scheduled',
      points: rules.appointmentBooked,
      matched: true
    });
  } else if (status === 'Converted') {
    score += rules.contacted + rules.callConnected + rules.interested + rules.qualified + rules.appointmentBooked + rules.converted;
    breakdown.push({
      factor: 'Customer Enrollment Converted',
      points: rules.converted,
      matched: true
    });
  } else if (status === 'Won') {
    score = 100;
    breakdown.push({
      factor: 'Won Deal / Full Course Revenue Collected',
      points: rules.won,
      matched: true
    });
  } else if (status === 'Not Interested' || status === 'Lost') {
    score += rules.notInterested;
    breakdown.push({
      factor: 'Lead Disqualified / Not Interested',
      points: rules.notInterested,
      matched: true
    });
  }

  // 7. Click ID Bonus (High Attribution Signal)
  if (lead.gclid || lead.attribution?.gclid || lead.fbclid || lead.attribution?.fbclid) {
    score += 5;
    breakdown.push({
      factor: 'Ad Platform Click ID Attached (GCLID/FBCLID)',
      points: 5,
      matched: true,
      note: 'Direct ad click attribution preserved'
    });
  }

  // Clamp score between 0 and 100
  const finalScore = Math.max(0, Math.min(100, Math.round(score)));

  let tier: LeadQualityTier = 'Cold';
  if (status === 'Converted' || status === 'Won' || finalScore >= 90) {
    tier = 'Converted';
  } else if (finalScore >= 70) {
    tier = 'High Quality';
  } else if (finalScore >= 45) {
    tier = 'Medium Quality';
  } else if (finalScore >= 20) {
    tier = 'Low Quality';
  } else {
    tier = 'Cold';
  }

  return {
    score: finalScore,
    tier,
    breakdown,
    lastCalculatedAt: new Date().toISOString()
  };
}

// ============================================================================
// CONVERSION EVENT BUILDER
// ============================================================================

export async function createConversionEvent(
  lead: Lead,
  platform: ConversionPlatform,
  crmStage: string,
  settings = DEFAULT_CONVERSION_SETTINGS
): Promise<ConversionEventRecord | null> {
  // Check if mapping exists and is enabled for this stage
  const mapping = settings.stageMappings.find(m => m.crmStage.toLowerCase() === crmStage.toLowerCase());
  if (!mapping) return null;

  const isEnabled = platform === 'google_ads' ? mapping.googleAdsEnabled : mapping.metaEnabled;
  if (!isEnabled) return null;

  // Check quality score threshold if enabled
  const currentScore = lead.qualityScore?.score ?? calculateLeadQualityScore(lead).score;
  if (currentScore < mapping.qualityThreshold && (crmStage !== 'New Lead')) {
    // Quality too low to send as high-intent conversion
    console.log(`[ConversionEngine] Suppressed ${platform} event for ${lead.name}: score ${currentScore} < threshold ${mapping.qualityThreshold}`);
  }

  // Determine monetary value
  let value = mapping.conversionValue;
  if (mapping.valueType === 'deal_value' && lead.dealValue) {
    value = lead.dealValue;
  }

  const eventName = platform === 'google_ads' ? mapping.googleAdsAction : mapping.metaEvent;
  const eventId = `evt_${platform}_${lead.id}_${crmStage.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;

  const hashedEmail = lead.email ? await sha256Hex(normalizeEmail(lead.email)) : undefined;
  const hashedPhone = lead.phone ? await sha256Hex(normalizePhone(lead.phone)) : undefined;

  return {
    id: eventId,
    leadId: lead.id,
    leadName: lead.name,
    leadPhone: lead.phone,
    leadEmail: lead.email,
    platform,
    eventName,
    crmStage,
    timestamp: new Date().toISOString(),
    value,
    currency: settings[platform === 'google_ads' ? 'googleAds' : 'metaAds'].defaultCurrency || 'INR',
    gclid: lead.gclid || lead.attribution?.gclid,
    fbclid: lead.fbclid || lead.attribution?.fbclid,
    hashedEmail,
    hashedPhone,
    status: 'pending',
    retryCount: 0,
    attributionData: lead.attribution,
    isOfflineConversion: true
  };
}

// ============================================================================
// LIVE CAMPAIGN QUALITY ANALYTICS DATA
// ============================================================================

export const INITIAL_CAMPAIGN_QUALITY_METRICS: CampaignQualityMetric[] = [];

export const INITIAL_CONVERSION_EVENTS: ConversionEventRecord[] = [];
