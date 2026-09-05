import React, { useState } from 'react';
import { PhoneCall, Send, CheckCircle2, X, RefreshCw } from 'lucide-react';
import { Lead } from '../types';

interface AiVoiceBotModalProps {
  lead: Lead | null;
  onClose: () => void;
}

export const AiVoiceBotModal: React.FC<AiVoiceBotModalProps> = ({ lead, onClose }) => {
  if (!lead) return null;

  const [customerUtterance, setCustomerUtterance] = useState('Hi, I saw your ad on Facebook about real estate CRM software.');
  const [loading, setLoading] = useState(false);
  const [chatThread, setChatThread] = useState<Array<{ sender: 'bot' | 'user'; text: string }>>([
    { sender: 'bot', text: `Hello ${lead.name}! I'm ARCLE AI Calling Bot calling from Enterprise CRM Solutions. Am I speaking with ${lead.name}?` }
  ]);
  const [extractedData, setExtractedData] = useState<any>(null);

  const handleSimulateTurn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerUtterance.trim()) return;

    const newThread = [...chatThread, { sender: 'user' as const, text: customerUtterance }];
    setChatThread(newThread);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/voice-bot-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadName: lead.name,
          customerUtterance,
          transcriptHistory: newThread.map((t) => `${t.sender}: ${t.text}`).join('\n')
        })
      });
      const data = await res.json();
      if (data.botReply) {
        setChatThread((prev) => [...prev, { sender: 'bot', text: data.botReply }]);
      }
      if (data.extractedDetails) {
        setExtractedData(data.extractedDetails);
      }
      setCustomerUtterance('');
    } catch (e) {
      console.error("Voice bot error:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">AI Voice Calling Bot Simulator</h3>
              <p className="text-[11px] text-slate-400">Automated AI Phone Qualification for {lead.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        {/* Conversation Stream */}
        <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
          {chatThread.map((msg, i) => (
            <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl text-xs ${
                msg.sender === 'user'
                  ? 'bg-purple-600 text-white rounded-br-none'
                  : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
              }`}>
                <p className="font-bold text-[10px] text-slate-400 mb-0.5">{msg.sender === 'bot' ? '🤖 AI Telecaller Bot' : `👤 ${lead.name}`}</p>
                <p className="leading-relaxed">{msg.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Extracted Details */}
        {extractedData && (
          <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 text-xs space-y-1">
            <p className="font-bold text-purple-300">AI Qualification Insights Extracted:</p>
            <p className="text-slate-300"><strong>Intent:</strong> {extractedData.intent} | <strong>Budget:</strong> {extractedData.budget} | <strong>Score:</strong> {extractedData.aiScore}</p>
          </div>
        )}

        {/* Simulation Input */}
        <form onSubmit={handleSimulateTurn} className="flex space-x-2 pt-1">
          <input
            type="text"
            value={customerUtterance}
            onChange={(e) => setCustomerUtterance(e.target.value)}
            placeholder="Type customer reply to simulate voice call..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold cursor-pointer shadow-md shadow-purple-900/30"
          >
            {loading ? 'Bot Speaking...' : 'Speak'}
          </button>
        </form>
      </div>
    </div>
  );
};
