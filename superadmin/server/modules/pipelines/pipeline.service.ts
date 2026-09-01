import crypto from 'crypto';

function hashSha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export let conversionSettings = {
  googleAds: {
    enabled: true,
    customerId: '984-211-0982',
    conversionActionName: 'Qualified Lead Admission',
    conversionActionId: 'conversions/9842110982/123849102',
    defaultCurrency: 'INR'
  },
  metaAds: {
    enabled: true,
    pixelId: '891029381029381',
    accessTokenConfigured: true,
    testEventCode: 'TEST98214',
    defaultCurrency: 'INR'
  },
  deduplicationRules: {
    preventDuplicateUploads: true,
    autoDisqualifyInvalid: true,
    attributionWindowDays: 90
  },
  stageMappings: [
    {
      crmStage: 'Interested',
      googleAdsAction: 'Lead (Form Submitted)',
      googleAdsEnabled: true,
      metaEvent: 'Lead',
      metaEnabled: true,
      conversionValue: 500
    },
    {
      crmStage: 'Counseling Scheduled',
      googleAdsAction: 'Counseling Scheduled',
      googleAdsEnabled: true,
      metaEvent: 'Schedule',
      metaEnabled: true,
      conversionValue: 1200
    },
    {
      crmStage: 'Walk-In / Campus Visit',
      googleAdsAction: 'Campus Visit',
      googleAdsEnabled: true,
      metaEvent: 'Contact',
      metaEnabled: true,
      conversionValue: 3500
    },
    {
      crmStage: 'Admission Confirmed',
      googleAdsAction: 'Admission Confirmed / Payment',
      googleAdsEnabled: true,
      metaEvent: 'Purchase',
      metaEnabled: true,
      conversionValue: 125000
    }
  ]
};

export let conversionEventQueue: any[] = [];

export class PipelineService {
  public getSettings() {
    return conversionSettings;
  }

  public updateSettings(newSettings: any) {
    conversionSettings = { ...conversionSettings, ...newSettings };
    return conversionSettings;
  }

  public getQueue(platform?: string, status?: string) {
    let filtered = [...conversionEventQueue];
    if (platform && platform !== 'all') {
      filtered = filtered.filter((e) => e.platform === platform);
    }
    if (status && status !== 'all') {
      filtered = filtered.filter((e) => e.status === status);
    }
    return {
      total: conversionEventQueue.length,
      filtered: filtered.length,
      queue: filtered.reverse()
    };
  }

  public dispatchConversion(lead: any, stageName: string, value?: number) {
    if (
      conversionSettings.deduplicationRules.autoDisqualifyInvalid &&
      (lead.isInvalid || lead.status === 'Invalid' || lead.isDuplicate)
    ) {
      return {
        status: 'skipped',
        reason: 'Lead is flagged as duplicate/invalid. Disqualified from quality conversion signal.'
      };
    }

    const mapping = conversionSettings.stageMappings.find(
      (m: any) => m.crmStage.toLowerCase() === stageName.toLowerCase()
    );

    const generatedEvents: any[] = [];
    const normalizedEmail = (lead.email || '').trim().toLowerCase();
    const normalizedPhone = (lead.phone || '').trim().replace(/[^\d+]/g, '');
    const hashedEmail = normalizedEmail ? hashSha256(normalizedEmail) : undefined;
    const hashedPhone = normalizedPhone ? hashSha256(normalizedPhone) : undefined;

    const eventValue = value || (mapping ? mapping.conversionValue : lead.dealValue || 100);

    if (conversionSettings.googleAds.enabled && mapping && mapping.googleAdsEnabled) {
      const idempotencyKey = `gads_${lead.id}_${stageName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      const googleEvent = {
        id: idempotencyKey,
        leadId: lead.id,
        leadName: lead.name,
        leadPhone: lead.phone,
        leadEmail: lead.email,
        platform: 'google_ads',
        eventName: mapping.googleAdsAction,
        crmStage: stageName,
        timestamp: new Date().toISOString(),
        value: eventValue,
        currency: conversionSettings.googleAds.defaultCurrency,
        gclid: lead.gclid || lead.attribution?.gclid,
        hashedEmail,
        hashedPhone,
        status: 'sent',
        sentAt: new Date().toISOString(),
        retryCount: 0,
        isOfflineConversion: true
      };
      conversionEventQueue.push(googleEvent);
      generatedEvents.push(googleEvent);
    }

    if (conversionSettings.metaAds.enabled && mapping && mapping.metaEnabled) {
      const idempotencyKey = `meta_${lead.id}_${stageName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      const metaEvent = {
        id: idempotencyKey,
        leadId: lead.id,
        leadName: lead.name,
        leadPhone: lead.phone,
        leadEmail: lead.email,
        platform: 'meta_ads',
        eventName: mapping.metaEvent,
        crmStage: stageName,
        timestamp: new Date().toISOString(),
        value: eventValue,
        currency: conversionSettings.metaAds.defaultCurrency,
        fbclid: lead.fbclid || lead.attribution?.fbclid,
        hashedEmail,
        hashedPhone,
        status: 'sent',
        sentAt: new Date().toISOString(),
        retryCount: 0,
        isOfflineConversion: true
      };
      conversionEventQueue.push(metaEvent);
      generatedEvents.push(metaEvent);
    }

    return {
      status: 'success',
      dispatchedCount: generatedEvents.length,
      events: generatedEvents
    };
  }

  public retryAll() {
    let retriedCount = 0;
    conversionEventQueue = conversionEventQueue.map((event) => {
      if (event.status === 'failed' || event.status === 'retrying') {
        retriedCount++;
        return {
          ...event,
          status: 'sent',
          sentAt: new Date().toISOString(),
          retryCount: (event.retryCount || 0) + 1
        };
      }
      return event;
    });
    return retriedCount;
  }

  public getCampaignQualityMetrics() {
    return [
      {
        id: 'camp-google-cpl-search',
        campaignName: 'Google Search - Commercial Pilot License',
        platform: 'Google Ads',
        adGroupOrSet: 'Keywords: [pilot cadet program, cpl admission 2026]',
        totalLeads: 84,
        qualifiedLeads: 58,
        convertedLeads: 29,
        invalidLeads: 2,
        duplicateLeads: 1,
        spend: 68000,
        revenue: 5800000,
        leadQualityRate: 69.04,
        conversionRate: 34.52,
        costPerLead: 809.52,
        costPerQualifiedLead: 1172.41,
        costPerConversion: 2344.82,
        roas: 85.29
      },
      {
        id: 'camp-meta-iata-cargo',
        campaignName: 'Master Form IATA Cargo',
        platform: 'Meta Ads',
        adGroupOrSet: 'Lookalike_Students_Degree_Kerala_Bangalore',
        totalLeads: 142,
        qualifiedLeads: 42,
        convertedLeads: 18,
        invalidLeads: 11,
        duplicateLeads: 6,
        spend: 28000,
        revenue: 2160000,
        leadQualityRate: 29.57,
        conversionRate: 12.67,
        costPerLead: 197.18,
        costPerQualifiedLead: 666.66,
        costPerConversion: 1555.55,
        roas: 77.14
      },
      {
        id: 'camp-meta-broad-kerala',
        campaignName: 'Master Form-Kerala-Vendor-Data',
        platform: 'Meta Ads',
        adGroupOrSet: 'Broad_Interest_Airhostess_SouthIndia',
        totalLeads: 325,
        qualifiedLeads: 48,
        convertedLeads: 14,
        invalidLeads: 52,
        duplicateLeads: 28,
        spend: 38000,
        revenue: 1680000,
        leadQualityRate: 14.76,
        conversionRate: 4.3,
        costPerLead: 116.92,
        costPerQualifiedLead: 791.66,
        costPerConversion: 2714.28,
        roas: 44.21
      }
    ];
  }
}

export const pipelineService = new PipelineService();
