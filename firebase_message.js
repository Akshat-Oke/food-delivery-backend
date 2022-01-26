const firebase = require("firebase-admin");
async function sendMessage({ registrationToken, restaurantName }) {
  const message = {
    notification: {
      title: "Your order has been dispatched",
      body: `${restaurantName} is on the way!`
    },
    token: registrationToken
  }
  const d = await firebase.messaging().send(message);
}
module.exports.sendMessage = sendMessage;