const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

// Delete files older than 4 months and 7 days
// 4 months (~120 days) + 7 days = 127 days
const DELETE_OLDER_THAN_DAYS = 127; 
const MS_PER_DAY = 1000 * 60 * 60 * 24;

const cleanupArchives = () => {
  console.log(`[Archive Cleaner] Starting cleanup... Looking for invoices older than ${DELETE_OLDER_THAN_DAYS} days.`);
  
  const archivesDir = path.join(__dirname, '..', 'archives', 'invoices');
  
  if (!fs.existsSync(archivesDir)) {
    console.log('[Archive Cleaner] Archives directory does not exist yet. Skipping cleanup.');
    return;
  }

  try {
    const files = fs.readdirSync(archivesDir);
    const now = Date.now();
    let deletedCount = 0;

    files.forEach(file => {
      const filePath = path.join(archivesDir, file);
      const stats = fs.statSync(filePath);
      
      const fileAgeMs = now - stats.mtime.getTime();
      const fileAgeDays = fileAgeMs / MS_PER_DAY;

      if (fileAgeDays > DELETE_OLDER_THAN_DAYS) {
        fs.unlinkSync(filePath);
        console.log(`[Archive Cleaner] Deleted old invoice: ${file} (Age: ${Math.round(fileAgeDays)} days)`);
        deletedCount++;
      }
    });

    console.log(`[Archive Cleaner] Cleanup complete. Deleted ${deletedCount} file(s).`);
  } catch (error) {
    console.error('[Archive Cleaner] Error during cleanup:', error);
  }
};

// Run cron job every day at 2:00 AM
const startArchiveCleaner = () => {
  cron.schedule('0 2 * * *', () => {
    cleanupArchives();
  });
  console.log('✅ Archive cleaner cron job scheduled (Runs daily at 2:00 AM)');
  
  // Optionally, run it once on startup just to check
  // cleanupArchives();
};

module.exports = { startArchiveCleaner, cleanupArchives };
