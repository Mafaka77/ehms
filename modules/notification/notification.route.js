const auth = require('../../middleware/auth');
const notificationController = require('./notification.controller');

module.exports = async function (fastify, opts) {
  fastify.post('/register-token', { onRequest: [auth] }, notificationController.registerToken);
  fastify.post('/unregister-token', { onRequest: [auth] }, notificationController.unregisterToken);
  fastify.get('/', { onRequest: [auth] }, notificationController.getNotifications);
  fastify.patch('/:id/read', { onRequest: [auth] }, notificationController.markAsRead);
  fastify.post('/read-all', { onRequest: [auth] }, notificationController.markAllAsRead);
  fastify.post('/send', { onRequest: [auth] }, notificationController.sendNotification);
  fastify.post('/test', { onRequest: [auth] }, notificationController.sendTestNotification);
};
