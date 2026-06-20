import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  writeBatch,
  query,
  limit
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize app securely
const app = initializeApp(firebaseConfig);

// Initialize Firestore securely and robustly with custom databaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

/**
 * Upload initial data to Firestore if a collection is completely empty
 */
export async function seedCollectionIfEmpty<T extends { id: string }>(
  collectionName: string, 
  initialItems: T[]
): Promise<T[]> {
  try {
    const colRef = collection(db, collectionName);
    const q = query(colRef, limit(1));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty && initialItems.length > 0) {
      console.log(`Seeding Firestore collection: "${collectionName}" with ${initialItems.length} records.`);
      const batch = writeBatch(db);
      initialItems.forEach(item => {
        const docRef = doc(db, collectionName, item.id);
        batch.set(docRef, item);
      });
      await batch.commit();
      return initialItems;
    } else if (!snapshot.empty) {
      // Return currently synced items from firestore
      const allSnapshot = await getDocs(colRef);
      const items: T[] = [];
      allSnapshot.forEach(doc => {
        items.push(doc.data() as T);
      });
      return items;
    }
  } catch (error) {
    console.error(`Error checking / seeding collection: ${collectionName}`, error);
  }
  return initialItems;
}

/**
 * Universal upsert / save function for a single document
 */
export async function saveDocument(collectionName: string, id: string, data: any): Promise<void> {
  try {
    const docRef = doc(db, collectionName, id);
    await setDoc(docRef, data, { merge: true });
  } catch (error) {
    console.error(`Error saving document to collection "${collectionName}" with ID ${id}:`, error);
  }
}

/**
 * Universal deletion helper
 */
export async function deleteDocument(collectionName: string, id: string): Promise<void> {
  try {
    const { deleteDoc } = await import('firebase/firestore');
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting document from collection "${collectionName}" with ID ${id}:`, error);
  }
}

/**
 * Save an entire list of state objects to Firestore via batch updates (differential or batch)
 */
export async function saveCollectionBulk<T extends { id: string }>(
  collectionName: string,
  items: T[]
): Promise<void> {
  try {
    const batch = writeBatch(db);
    items.forEach(item => {
      const docRef = doc(db, collectionName, item.id);
      batch.set(docRef, item, { merge: true });
    });
    await batch.commit();
  } catch (error) {
    console.error(`Error writing bulk collection "${collectionName}":`, error);
  }
}

/**
 * Completely clean collection documents (for demo purge function)
 */
export async function clearCollection(collectionName: string, currentItemIds: string[]): Promise<void> {
  try {
    const { deleteDoc } = await import('firebase/firestore');
    const batch = writeBatch(db);
    for (const id of currentItemIds) {
      const docRef = doc(db, collectionName, id);
      batch.delete(docRef);
    }
    await batch.commit();
  } catch (error) {
    console.error(`Error clearing collection "${collectionName}":`, error);
  }
}
