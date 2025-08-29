const database_name = 'Dictatable'

const object_store_name = "pages"

let database; // Will hold the database connection

async function initializeDatabase() {
  return new Promise((resolve, reject) => {
    if (database) {
      resolve(database);
      return;
    }

    // The non-fragile approch is to leave the version out. However, until the version
    // actually matters (multiple incompatable database schemes in production) stay at version 1
    const request = indexedDB.open(database_name, 1);

    request.onerror = (event) => {
      console.error("Error opening database:", event);
      reject(event);
    };

    request.onsuccess = (event) => {
      database = event.target.result;
      resolve(database);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains(object_store_name)) {
        database.createObjectStore(object_store_name); // No keyPath specified, so we'll provide keys when adding data
        console.log(`Object store "${object_store_name}" created.`);
      }
    };
  });
}

export async function store(key, data) {
  try {
    const database = await initializeDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([object_store_name], 'readwrite');
      transaction.objectStore(object_store_name).put(data, key).onsuccess = () => {
        resolve();
      };
      transaction.objectStore(object_store_name).put(data, key).onerror = (event) => {
        console.error(`Error storing data for key "${key}":`, event);
        reject(event);
      };
    });
  } catch (error) {
    console.error("Error initializing database for store:", error);
    throw error;
  }
}

export async function load(key) {
  try {
    const database = await initializeDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([object_store_name], 'readonly');
      transaction.objectStore(object_store_name).get(key).onsuccess = (event) => {
        resolve(event.target.result);
      };
      transaction.objectStore(object_store_name).get(key).onerror = (event) => {
        console.error(`Error loading data for key "${key}":`, event);
        reject(event);
      };
    });
  } catch (error) {
    console.error("Error initializing database for load:", error);
    throw error;
  }
}

// Delete a store 
async function cleanup_store(dbName, storeNameToDelete) {
  let db;
  
  const request = indexedDB.open(dbName, 2); // Increment the version number to trigger upgradeneeded
  
  request.onerror = (event) => {
    console.error("Database open error:", event);
  };
  
  request.onsuccess = (event) => {
    db = event.target.result;
    console.log("Database opened successfully.");
    // You can perform other operations here if needed, 
    // but the deletion happens in the upgradeneeded event.
  };
  
  request.onupgradeneeded = (event) => {
    db = event.target.result;
    console.log("cleanup B")
  
    // Check if the object store exists before attempting to delete it
    if (db.objectStoreNames.contains(storeNameToDelete)) {
      db.deleteObjectStore(storeNameToDelete);
      console.log(`Object store "${storeNameToDelete}" deleted.`);
    } else {
      console.log(`Object store "${storeNameToDelete}" does not exist.`);
    }
  };
  return request
}

async function cleanup_database(dbNameToDelete) {

  let db; // Your current database connection

  // Try to open the database first (you might already have it open)
  const openRequest = indexedDB.open(dbNameToDelete);

  openRequest.onsuccess = (event) => {
    db = event.target.result;
    if (db) {
      db.close(); // Close the connection in the current context
      db = null;
      console.log("Current database connection closed before deletion attempt.");
    }
    initiateDatabaseDeletion(dbNameToDelete);
  };

  openRequest.onerror = (event) => {
    console.error("Error opening database for potential closure:", event);
    initiateDatabaseDeletion(dbNameToDelete); // Try to delete anyway
  };

  function initiateDatabaseDeletion(dbName) {
    const deleteRequest = indexedDB.deleteDatabase(dbName);

    deleteRequest.onsuccess = () => {
      console.log(`Database "${dbName}" deleted successfully.`);
    };

    deleteRequest.onerror = (event) => {
      console.error(`Error deleting database "${dbName}":`, event);
    };

    deleteRequest.onblocked = () => {
      console.log(`Deletion of database "${dbName}" is blocked. Please close all other tabs/windows using this database and try again.`);
    };
  }
}

async function test() {
  await cleanup_database(database_name)
  await initializeDatabase(); // Ensure the database is ready

  const dataToStore = { name: 'My Document', content: 'This is some content.' };
  const dataKey = 'document_1';

  await store(dataKey, dataToStore);
  console.log(`Data stored with key "${dataKey}".`);

  const loadedData = await load(dataKey);
  if (loadedData) {
    console.log(`Loaded data for key "${dataKey}":`, loadedData);
  } else {
    console.log(`No data found for key "${dataKey}".`);
  }

  const anotherData = { settings: { theme: 'dark', fontSize: 12 } };
  const settingsKey = 'user_settings';
  await store(settingsKey, anotherData);
  console.log(`Data stored with key "${settingsKey}".`);

  const loadedSettings = await load(settingsKey);
  if (loadedSettings) {
    console.log(`Loaded data for key "${settingsKey}":`, loadedSettings);
  }

  const database = await initializeDatabase()
  database.close()
  //let databaseToo = await cleanup_store(database_name, object_store_name)
  //databaseToo.close()
  await cleanup_database(database_name)
}

//test();