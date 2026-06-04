const crypto = require('crypto');
const activityService = require('./activity.service');

/**
 * Log an audit trail entry with a cryptographic hash chain.
 * MUST be called inside a Prisma transaction (tx).
 */
const log = async (tx, { userId, action, tableName, recordId, oldValues, newValues, ipAddress }) => {
    // 1. Fetch previous hash from the last audit entry
    const lastAudit = await tx.auditTrail.findFirst({
        orderBy: { id: 'desc' },
        select: { hash: true }
    });

    const previousHash = lastAudit?.hash || 'genesis';

    // 2. Compute current timestamp and hash
    const timestamp = new Date();
    
    // Format: previousHash + timestamp (ISO) + action + recordId + userId
    const dataString = `${previousHash}${timestamp.toISOString()}${action}${recordId}${userId}`;
    const hash = crypto.createHash('sha256').update(dataString).digest('hex');

    // 3. Create the entry
    const auditRecord = await tx.auditTrail.create({
        data: {
            userId,
            action,
            tableName,
            recordId,
            oldValues: oldValues ? JSON.parse(JSON.stringify(oldValues)) : null,
            newValues: newValues ? JSON.parse(JSON.stringify(newValues)) : null,
            ipAddress,
            createdAt: timestamp,
            hash,
            previousHash
        }
    });

    // 4. Also log to activity feed for UI (fire and forget, outside tx)
    try {
        const resource = mapTableNameToResource(tableName);
        const details = generateActivityDetails(action, resource, recordId, oldValues, newValues);
        // activityService will fetch user name and prepend it to the details if we just pass details
        // Wait, activity.service.js logActivity expects: (userId, action, resource, resourceId, details)
        // BUT ActivityTimeline.jsx renders: {activity.details || ...}
        // If we want it to literally say "System Administrator created..." we need the user's name!
        // It's better to just let ActivityTimeline.jsx prepend the user's name, so we just provide the suffix:
        activityService.logActivity(userId, action, resource, recordId, details).catch(e => console.error(e));
    } catch (err) {
        console.error('Failed to dispatch activity log from audit:', err);
    }

    return auditRecord;
};

const mapTableNameToResource = (tableName) => {
    if (tableName === 'Rfp') return 'RFP';
    if (tableName === 'Prf') return 'PRF';
    if (tableName === 'TripTicket') return 'TRIP_TICKET';
    return tableName.toUpperCase();
};

const generateActivityDetails = (action, resource, recordId, oldValues, newValues) => {
    const resourceName = resource === 'TRIP_TICKET' ? 'Trip Ticket' : resource;
    
    if (action === 'CREATE') {
        return `created a ${resourceName} (Form #${recordId})`;
    } else if (action === 'UPDATE' || action === 'APPROVE' || action === 'REJECT' || action === 'CANCEL' || action === 'VERIFY' || action === 'ENDORSE') {
        const newStatus = newValues?.status || 'updated';
        return `updated ${resourceName} #${recordId} status to ${newStatus}`;
    }
    return `performed ${action} on ${resourceName} #${recordId}`;
};

module.exports = {
    log
};
