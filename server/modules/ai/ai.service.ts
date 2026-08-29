import { GoogleGenAI } from '@google/genai';
import { logger } from '../../utils/logger';

export class AiService {
  private aiClient: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      try {
        this.aiClient = new GoogleGenAI({ apiKey });
      } catch (err) {
        logger.warn('Failed to initialize GoogleGenAI client:', err);
      }
    }
  }

  public async scoreLead(lead: any) {
    if (!this.aiClient) {
      const score = Math.min(
        98,
        Math.max(
          20,
          (lead.dealValue ? Math.min(lead.dealValue / 10000, 40) : 20) +
            (lead.source === 'IndiaMart' || lead.source === 'Facebook Ads' ? 30 : 20)
        )
      );
      const rating = score >= 75 ? 'Hot' : score >= 50 ? 'Warm' : 'Cold';
      return {
        aiScore: Math.round(score),
        aiRating: rating,
        aiReasoning: `Lead scored based on high intent signals from ${lead.source || 'Inbound'} and estimated deal budget of ₹${lead.dealValue || 50000}.`,
        keyDrivers: ['High deal budget potential', 'Proven source channel', 'Active follow-up stage'],
        recommendedAction: 'Schedule a product demo within 2 hours.'
      };
    }

    const prompt = `Analyze this sales lead and provide an AI lead score (0-100), intent rating (Hot, Warm, or Cold), detailed reasoning, key drivers, and recommended next action for a telecaller agent.
Lead Details:
Name: ${lead.name}
Company: ${lead.company || 'N/A'}
Source: ${lead.source}
Status/Stage: ${lead.status}
Deal Value: ₹${lead.dealValue || 0}
City/Location: ${lead.city}, ${lead.state}
Notes: ${lead.notes || 'Inquired about product pricing and deployment timeline.'}

Respond strictly in JSON format matching this schema:
{
  "aiScore": number (0 to 100),
  "aiRating": "Hot" | "Warm" | "Cold",
  "aiReasoning": "string explaining why this score was assigned",
  "keyDrivers": ["array of 3 short key positive or negative drivers"],
  "recommendedAction": "string specifying exact action for telecaller"
}`;

    const response = await this.aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    return JSON.parse(response.text || '{}');
  }

  public async transcribeCall(params: { leadName: string; callNotes?: string; disposition?: string; durationSeconds?: number }) {
    if (!this.aiClient) {
      return {
        transcript: `[00:02] Agent: Hello, am I speaking with ${params.leadName}?\n[00:05] Lead: Yes, this is ${params.leadName}. I requested information regarding your CRM automation suite.\n[00:15] Agent: Great! I see you are looking for automated dialers and WhatsApp integration. When are you looking to implement?\n[00:25] Lead: We have a team of 15 telecallers and want to onboard by next week if pricing fits our budget.\n[00:40] Agent: Perfect. I will send our custom proposal over WhatsApp right now.`,
        aiSummary: `${params.leadName} operates a 15-member telecalling team and requires rapid onboarding for WhatsApp automation and dialers next week.`,
        sentiment: 'Positive',
        keyObjections: ['Budget evaluation against existing tools'],
        agreedNextSteps: 'Send formal proposal via WhatsApp and schedule follow-up call tomorrow at 11 AM.',
        suggestedWhatsAppResponse: `Hi ${params.leadName}, thank you for taking my call! As discussed, here is our feature comparison and customized pricing for your 15-member team: https://antigravitycrm.io/p/${params.leadName.toLowerCase().replace(/\s+/g, '')}`
      };
    }

    const prompt = `You are an AI Sales Call Intelligence System. Analyze this call record for lead "${params.leadName}" and generate a realistic call transcript, concise summary, sentiment analysis (Positive, Neutral, Negative, or Escalation), objections, next steps, and a ready-to-send WhatsApp follow-up text.
Call Context:
Lead Name: ${params.leadName}
Disposition: ${params.disposition || 'Follow Up'}
Duration: ${params.durationSeconds || 45} seconds
Call Notes from Telecaller: ${params.callNotes || 'Interested in WhatsApp bulk broadcast and AI lead scoring.'}

Return JSON with schema:
{
  "transcript": "formatted line-by-line speaker transcript",
  "aiSummary": "2-sentence executive summary of customer intent",
  "sentiment": "Positive" | "Neutral" | "Negative" | "Escalation",
  "keyObjections": ["list of objections or concerns"],
  "agreedNextSteps": "exact agreed action item",
  "suggestedWhatsAppResponse": "engaging ready-to-send WhatsApp message"
}`;

    const response = await this.aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    return JSON.parse(response.text || '{}');
  }

  public async generateWhatsApp(params: { leadName: string; company?: string; product?: string; stage?: string; intent?: string }) {
    if (!this.aiClient) {
      return {
        message: `Hi ${params.leadName} 👋! Thanks for connecting with Antigravity CRM. Based on your interest in ${params.product || 'Automated WhatsApp Marketing & Power Dialer'}, I've prepared a quick 2-min demo video for ${params.company || 'your team'}: https://antigravitycrm.io/demo\n\nWhen would be a good time for a quick 5-min walkthrough today? 🚀`
      };
    }

    const prompt = `Write a high-converting, professional yet warm WhatsApp message for lead "${params.leadName}" at "${params.company || 'Company'}".
Product Interest: ${params.product || 'Antigravity CRM'}
Current Sales Stage: ${params.stage || 'New Lead'}
Target Intent: ${params.intent || 'Schedule Product Demo'}

Requirements:
- Keep under 60 words.
- Include 2-3 clean emojis.
- End with an engaging open-ended question or clear CTA.
- Use line breaks for easy mobile reading.

Return JSON: { "message": "string" }`;

    const response = await this.aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    return JSON.parse(response.text || '{}');
  }

  public async voiceBotInterview(params: { leadName: string; userUtterance: string; conversationHistory?: any[] }) {
    if (!this.aiClient) {
      return {
        botResponse: `Thanks for letting me know, ${params.leadName}. To help assign your team the best specialist, what is your estimated monthly lead volume?`,
        qualificationScore: 82,
        isQualified: true,
        nextQuestionPrompt: 'Asking for monthly lead volume and telecaller team size.'
      };
    }

    const prompt = `You are Antigravity AI Voice Bot, an automated outbound telecalling bot conducting pre-qualification interviews for business leads in India.
Lead Name: ${params.leadName}
Lead's latest response: "${params.userUtterance}"
Previous Conversation Context: ${JSON.stringify(params.conversationHistory || [])}

Goal: Speak clearly, concisely, polite, professional, and ask relevant qualification questions (team size, budget, timeline, software currently used).

Return JSON:
{
  "botResponse": "spoken response to lead (max 30 words)",
  "qualificationScore": number (0-100),
  "isQualified": boolean,
  "nextQuestionPrompt": "summary of purpose"
}`;

    const response = await this.aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    return JSON.parse(response.text || '{}');
  }

  public async businessInsights(params: { totalLeads?: number; totalCalls?: number; totalRevenue?: number; topLeadSources?: any[]; conversionRate?: string }) {
    if (!this.aiClient) {
      return {
        insights: [
          {
            title: 'High CPL Leakage on Google Ads',
            impact: 'High',
            category: 'Marketing ROI',
            recommendation: 'Google Ads conversion rate is 3.2% vs 8.7% on WhatsApp Inbound. Shift 20% budget to Facebook/WhatsApp Click-to-Chat ads.'
          },
          {
            title: 'Peak Telecaller Engagement Window',
            impact: 'Medium',
            category: 'Telecaller Efficiency',
            recommendation: 'Calls made between 11:30 AM and 1:00 PM have a 64% connection rate compared to 28% after 5:00 PM. Schedule power dialer batches during morning peak.'
          },
          {
            title: 'Lead Response Time SLA Alert',
            impact: 'High',
            category: 'Lead Distribution',
            recommendation: 'IndiaMart leads take an average of 42 minutes to receive first call. Setting up Auto-WhatsApp Welcome within 30 seconds can improve lead qualification by 3.5x.'
          }
        ]
      };
    }

    const prompt = `You are Chief Revenue Officer & AI Business Analyst for Antigravity CRM. Analyze performance metrics and output 3 high-impact, actionable revenue growth recommendations.
Metrics:
Total Leads: ${params.totalLeads || 450}
Total Calls Today: ${params.totalCalls || 180}
Monthly Revenue: ₹${params.totalRevenue || 1250000}
Conversion Rate: ${params.conversionRate || '14.2%'}
Lead Sources: ${JSON.stringify(params.topLeadSources || ['IndiaMart', 'Facebook Ads', 'Google Ads', 'WhatsApp Inbound'])}

Return JSON:
{
  "insights": [
    {
      "title": "short title",
      "impact": "High" | "Medium" | "Low",
      "category": "category name",
      "recommendation": "detailed actionable advice with concrete ROI numbers"
    }
  ]
}`;

    const response = await this.aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    return JSON.parse(response.text || '{}');
  }
}

export const aiService = new AiService();
