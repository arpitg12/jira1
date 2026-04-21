import { MongoClient } from 'mongodb';

const removeOldDatabases = async () => {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const admin = client.db('admin').admin();
    
    console.log('📊 Checking for duplicate databases...\n');
    
    // List all databases
    const databases = await admin.listDatabases();
    const dbNames = databases.databases.map(db => db.name);
    
    console.log('Existing databases:');
    dbNames.forEach(name => console.log(`  - ${name}`));
    
    // Drop jira-app if it exists
    if (dbNames.includes('jira-app')) {
      const jiraAppDb = client.db('jira-app');
      await jiraAppDb.dropDatabase();
      console.log('\n✅ Dropped old jira-app database');
    }
    
    // Verify only jira-clone remains
    const updatedDbs = await admin.listDatabases();
    const finalDbNames = updatedDbs.databases.map(db => db.name);
    
    console.log('\n✅ Final databases:');
    finalDbNames.forEach(name => {
      if (name === 'jira-clone') {
        console.log(`  ✓ ${name} (PRIMARY)`);
      } else {
        console.log(`  - ${name}`);
      }
    });
    
    console.log('\n🎯 Database consolidation complete!\n');
    
  } finally {
    await client.close();
  }
};

removeOldDatabases();
