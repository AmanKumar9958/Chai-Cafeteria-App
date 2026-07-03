const cron = require('node-cron');
const { Expo } = require('expo-server-sdk');
const User = require('../models/User');

// Create a new Expo SDK client
const expo = new Expo();

// Batch size for processing users — prevents loading all users into memory
const BATCH_SIZE = 100;

// Lock to prevent overlapping cron executions
let isSending = false;

/**
 * Send push notifications in batches to avoid blocking the main thread
 * and consuming excessive memory with large user bases.
 */
const sendDailyNotifications = async (title, body) => {
  if (isSending) {
    console.log('Notification job already running, skipping this execution.');
    return;
  }

  isSending = true;
  let totalSent = 0;
  let totalSkipped = 0;

  try {
    // Count total users with push tokens for logging
    const totalUsers = await User.countDocuments({ pushToken: { $ne: null } });

    if (totalUsers === 0) {
      console.log('No users with push tokens found.');
      return;
    }

    console.log(`Starting notification send to ${totalUsers} users in batches of ${BATCH_SIZE}...`);

    // Process users in batches using skip/limit instead of loading all at once
    let processed = 0;

    while (processed < totalUsers) {
      try {
        const users = await User.find({ pushToken: { $ne: null } })
          .select('pushToken')
          .skip(processed)
          .limit(BATCH_SIZE)
          .lean();

        if (users.length === 0) break;

        // Build messages for this batch
        const messages = [];
        for (const user of users) {
          if (!Expo.isExpoPushToken(user.pushToken)) {
            totalSkipped++;
            continue;
          }

          messages.push({
            to: user.pushToken,
            sound: 'default',
            title: title,
            body: body,
            data: { withSome: 'data' },
          });
        }

        // Send this batch via Expo's chunking
        if (messages.length > 0) {
          const chunks = expo.chunkPushNotifications(messages);

          for (const chunk of chunks) {
            try {
              const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
              totalSent += ticketChunk.length;
            } catch (error) {
              console.error(`Error sending notification chunk (batch starting at ${processed}):`, error.message);
            }
          }
        }

        processed += users.length;
      } catch (batchError) {
        console.error(`Error processing batch starting at ${processed}:`, batchError.message);
        processed += BATCH_SIZE; // Skip this batch and continue
      }
    }

    console.log(`Notification job complete: ${totalSent} sent, ${totalSkipped} skipped (invalid tokens), ${totalUsers} total users.`);

  } catch (error) {
    console.error('Error in sendDailyNotifications:', error);
  } finally {
    isSending = false;
  }
};

const startScheduler = () => {
  console.log('Starting notification scheduler...');

  // Schedule 1: 11:00 AM IST
  cron.schedule('0 11 * * *', () => {
    console.log('Running 11:00 AM notification job');
    sendDailyNotifications(
      'Good Morning! ☕',
      'Time for a mid-morning break? Order your favorite chai now!'
    );
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });

  // Schedule 2: 6:00 PM (18:00) IST
  cron.schedule('0 18 * * *', () => {
    console.log('Running 6:00 PM notification job');
    sendDailyNotifications(
      'Evening Snack Time! 🥪',
      'Hungry? Grab a quick snack and recharge for the evening.'
    );
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });
};

module.exports = { startScheduler };
