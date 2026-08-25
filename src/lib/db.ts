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
  // Mock data seeding disabled for live production Meta Lead Ads integration
}

export async function clearAllLeadsFromFirestore() {
  try {
    const leadsSnap = await getDocs(collection(db, 'leads'));
    const batch = writeBatch(db);
    leadsSnap.forEach((docSnap) => {
      batch.delete(doc(db, 'leads', docSnap.id));
    });
    await batch.commit();
    console.log('Cleared all mock leads from Firestore.');
  } catch (e: any) {
    console.warn('Error clearing Firestore leads:', e?.message);
  }
}

