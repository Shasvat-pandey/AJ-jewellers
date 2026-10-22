# AJ Jewellers — Database & Storage Disaster Recovery Protocol

## 1. Objectives

This document establishes the official backup, snapshot retention, and disaster recovery procedures for the AJ Jewellers platform, ensuring business continuity for customer records, orders, invoices, and payment evidence.

---

## 2. MongoDB Atlas Backup Strategy

1. **Continuous Cloud Backups (Point-in-Time Recovery):**
   - Enabled via MongoDB Atlas with continuous oplog archiving.
   - Retains granular recovery checkpoints up to the past 7 days.
2. **Daily Scheduled Snapshots:**
   - Automated snapshot taken every 24 hours at 02:00 UTC.
   - 30-day snapshot retention policy.
3. **Manual CLI Backup (`mongodump`):**
   ```bash
   # Export encrypted database archive
   mongodump --uri="$MONGO_URI" --archive="mongodb-backup-$(date +%F).gz" --gzip
   ```
4. **Database Restoration (`mongorestore`):**
   ```bash
   # Restore database from archive
   mongorestore --uri="$MONGO_URI" --archive="mongodb-backup-2026-10-20.gz" --gzip --drop
   ```

---

## 3. Media & Evidence File Storage Recovery

1. **Uploads Directory (`server/uploads`):**
   - Contains catalog product imagery and private payment evidence in `uploads/evidence/`.
   - In persistent volume deployments, configure automated daily snapshot policies on the block storage volume.
2. **Archived Invoices (`server/archives/invoices`):**
   - Generated PDF invoices are automatically retained for 4 months by `archiveCleaner.js`.
   - High-value invoices can also be regenerated on demand from the database records using `invoiceGenerator.js`.

---

## 4. Emergency Incident Response Procedure

1. **Service Disruption Detected:**
   - Verify server logs (`pm2 logs` or container console).
   - If database connection drops, verify MongoDB Atlas IP access list and cluster status.
2. **Data Corruption or Accidental Modification:**
   - Pause backend container to prevent cascading updates.
   - Initiate point-in-time restore to the timestamp immediately prior to the incident.
   - Restart service and verify data integrity using admin dashboard.
