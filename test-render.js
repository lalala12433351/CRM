import { renderToString } from 'react-dom/server';
import React from 'react';
import { LeadDetailModal } from './src/components/LeadDetailModal.tsx';
import { INITIAL_LEADS, INITIAL_ACTIVITIES, INITIAL_MESSAGES, INITIAL_CALL_RECORDS, INITIAL_AGENTS } from './src/data/mockData.ts';

try {
  const html = renderToString(
    React.createElement(LeadDetailModal, {
      lead: INITIAL_LEADS[0],
      allLeads: INITIAL_LEADS,
      agents: INITIAL_AGENTS,
      activities: INITIAL_ACTIVITIES,
      messages: INITIAL_MESSAGES,
      callRecords: INITIAL_CALL_RECORDS,
      onClose: () => {},
      onSelectLead: () => {},
      onUpdateLead: () => {},
      onAddActivity: () => {},
      onSendMessage: () => {},
      onDeleteLead: () => {},
      onUpdateCallRecord: () => {},
    })
  );
  console.log("Render successful!");
} catch (e) {
  console.error("Render failed:");
  console.error(e);
}
