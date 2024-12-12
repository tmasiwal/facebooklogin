const MessageModel = require('../Model/message.model');

// Add or Update Message
const handleMessageChange = async (data) => {
  try {
    const messageData = data.entry[0].changes[0].value.statuses[0];

    // Check if the message already exists
    let message = await MessageModel.findOne({ id: messageData.id });

    if (!message) {
      // If message doesn't exist, create a new entry
      message = new MessageModel({
        phone_number_id: data.entry[0].changes[0].value.metadata.phone_number_id,
        waba_id: data.entry[0].id,
        id: messageData.id,
        timestamp: new Date(messageData.timestamp * 1000), // Convert Unix timestamp to Date
        to: messageData.recipient_id,
        status: messageData.status,
        direction: 'sent', // Assuming this direction
      });
    } else {
      // Update existing message
      message.status = messageData.status;
      if (messageData.status === 'failed') {
        message.failure_reason = messageData.failure_reason || null;
      }
      message.timestamp = new Date(messageData.timestamp * 1000);
    }

    // Save to the database
    await message.save();
    console.log('Message saved or updated successfully:', message);
  } catch (error) {
    console.error('Error handling message change:', error);
  }
};

module.exports = { handleMessageChange };
