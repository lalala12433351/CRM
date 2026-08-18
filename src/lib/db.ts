import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from './firebase';
import { 
  INITIAL_LEADS, 
  INITIAL_AGENTS, 
  INITIAL_ACTIVITIES, 
  INITIAL_MESSAGES, 
  INITIAL_CALL_RECORDS, 
  INITIAL_TEMPLATES, 
  INITIAL_CAMPAIGNS, 
  INITIAL_WORKFLOWS, 
  INITIAL_CUSTOM_FIELDS, 
  INITIAL_STAGES 
} from '../data/mockData';

export async function seedDatabase() {
  const leadsSnap = await getDocs(collection(db, 'leads'));
  if (!leadsSnap.empty) {
    console.log('Database already seeded!');
    return;
  }

  console.log('Seeding database with initial data...');
  const batch = writeBatch(db);

  const seedCollection = (collName: string, items: any[]) => {
    items.forEach((item) => {
      const ref = doc(db, collName, item.id);
      batch.set(ref, item);
    });
  };

  seedCollection('leads', INITIAL_LEADS);
  seedCollection('agents', INITIAL_AGENTS);
  seedCollection('activities', INITIAL_ACTIVITIES);
  seedCollection('messages', INITIAL_MESSAGES);
  seedCollection('callRecords', INITIAL_CALL_RECORDS);
  seedCollection('templates', INITIAL_TEMPLATES);
  seedCollection('campaigns', INITIAL_CAMPAIGNS);
  seedCollection('workflows', INITIAL_WORKFLOWS);
  seedCollection('customFields', INITIAL_CUSTOM_FIELDS);
  seedCollection('stages', INITIAL_STAGES);

  await batch.commit();
  console.log('Database seeding complete!');
}
