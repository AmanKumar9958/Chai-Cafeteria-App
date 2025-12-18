const cron = require('node-cron');
const { Expo } = require('expo-server-sdk');
const User = require('../models/User');

// Create a new Expo SDK client
// optionally providing an access token if you have enabled push security
const expo = new Expo();

const sendDailyNotifications = async (title, body) => {
  try {
    // 1. Find all users with a push token
    const users = await User.find({ pushToken: { $ne: null } });
    
    if (users.length === 0) {
      console.log('No users with push tokens found.');
      return;
    }

    let messages = [];
    for (let user of users) {
      // Check if the token is a valid Expo push token
      if (!Expo.isExpoPushToken(user.pushToken)) {
        console.error(`Push token ${user.pushToken} is not a valid Expo push token`);
        continue;
      }

      // Construct the message
      messages.push({
        to: user.pushToken,
        sound: 'default',
        title: title,
        body: body,
        data: { withSome: 'data' },
      });
    }

    // 2. Batch the notifications
    let chunks = expo.chunkPushNotifications(messages);
    let tickets = [];

    // 3. Send the chunks
    for (let chunk of chunks) {
      try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        console.log('Notification tickets:', ticketChunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending chunk:', error);
      }
    }
    
    // Note: You might want to handle receipt logic here if needed (to check for delivery errors)
    console.log(`Sent ${messages.length} notifications.`);

  } catch (error) {
    console.error('Error in sendDailyNotifications:', error);
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
