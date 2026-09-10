const Notification = require('./notification.model');
const User = require('../auth/user.model');
const Role = require('../auth/role.model');
const { sendToDevice, sendMulticast } = require('../../config/firebase');

const ADMIN_ROLES = ['SuperAdmin', 'HospitalAdmin', 'Admin'];

/**
 * Helper to get user and all their role names
 */
async function getUserRoles(userId) {
  if (!userId) return [];
  const user = await User.findById(userId).populate('role').populate('roles');
  if (!user) return [];
  const roleNames = [
    user.role?.name,
    ...(user.roles?.map(r => r.name) || [])
  ].filter(Boolean);
  return [...new Set(roleNames)];
}

/**
 * Build MongoDB query for notifications based on user's role
 */
function buildRoleScopedQuery(userId, userRoleNames) {
  const isAdmin = userRoleNames.some(r => ADMIN_ROLES.includes(r));
  if (isAdmin) {
    // Admins can see all notifications across the entire hospital
    return {};
  }

  // 1. Direct notifications specifically addressed to this user
  const directUserFilter = { recipient: userId };

  // 2. Departmental / Role-targeted broadcasts (where recipient is null)
  const broadcastFilters = [];

  // Notifications explicitly targeting the user's assigned roles
  broadcastFilters.push({
    recipient: null,
    targetRoles: { $in: userRoleNames }
  });

  // Pharmacy roles (PharmacyManager, Pharmacist)
  if (userRoleNames.some(r => ['PharmacyManager', 'Pharmacist', 'PharmacyIndent'].includes(r))) {
    broadcastFilters.push({
      recipient: null,
      $or: [
        { department: 'pharmacy' },
        { type: { $regex: '^PHARMACY_', $options: 'i' } }
      ]
    });
  }

  // Doctor roles
  if (userRoleNames.includes('Doctor') || userRoleNames.includes('Medical Officer')) {
    broadcastFilters.push({
      recipient: null,
      $or: [
        { department: 'doctor' },
        { type: { $in: ['APPOINTMENT', 'OPD', 'DOCTOR_ACTIVITY', 'DOCTOR_ALERT'] } }
      ]
    });
  }

  // Nursing & IPD roles
  if (userRoleNames.some(r => ['Nurse', 'IPD Nurse', 'EmergencyNurse', 'OT Nurse', 'StationIncharge', 'NursingManager'].includes(r))) {
    broadcastFilters.push({
      recipient: null,
      $or: [
        { department: 'nursing' },
        { type: { $in: ['ADMISSION', 'NURSING', 'EMERGENCY', 'BED_TRANSFER', 'PATIENT_ALERT'] } }
      ]
    });
  }

  // Laboratory roles
  if (userRoleNames.some(r => ['LabManager', 'LabTechnician'].includes(r))) {
    broadcastFilters.push({
      recipient: null,
      $or: [
        { department: 'laboratory' },
        { type: { $regex: '^LAB_', $options: 'i' } }
      ]
    });
  }

  // Radiology roles
  if (userRoleNames.includes('Radiology Department')) {
    broadcastFilters.push({
      recipient: null,
      $or: [
        { department: 'radiology' },
        { type: { $regex: '^RADIOLOGY_', $options: 'i' } }
      ]
    });
  }

  // Endoscopy roles
  if (userRoleNames.some(r => ['Endoscopy Department', 'Endoscopy'].includes(r))) {
    broadcastFilters.push({
      recipient: null,
      $or: [
        { department: 'endoscopy' },
        { type: { $regex: '^ENDOSCOPY_', $options: 'i' } }
      ]
    });
  }

  // Accounts / Cashier roles
  if (userRoleNames.some(r => ['Cashier', 'Accountant'].includes(r))) {
    broadcastFilters.push({
      recipient: null,
      $or: [
        { department: 'billing' },
        { type: { $in: ['BILLING', 'INVOICE', 'PAYMENT'] } }
      ]
    });
  }

  // General system broadcasts
  broadcastFilters.push({
    recipient: null,
    targetRoles: { $size: 0 },
    department: null,
    type: 'SYSTEM'
  });

  return {
    $or: [
      directUserFilter,
      ...broadcastFilters
    ]
  };
}

exports.registerToken = async (req, reply) => {
  try {
    const { token } = req.body;
    if (!token) {
      return reply.code(400).send({ message: 'Device token is required' });
    }

    const userId = req.user?.id || req.user?._id;
    if (userId) {
      await User.findByIdAndUpdate(userId, {
        $addToSet: { fcmTokens: token }
      });
    }

    return reply.send({ success: true, message: 'Device token registered successfully' });
  } catch (err) {
    return reply.code(500).send({ message: err.message });
  }
};

exports.unregisterToken = async (req, reply) => {
  try {
    const { token } = req.body;
    const userId = req.user?.id || req.user?._id;
    if (userId && token) {
      await User.findByIdAndUpdate(userId, {
        $pull: { fcmTokens: token }
      });
    }
    return reply.send({ success: true, message: 'Device token unregistered' });
  } catch (err) {
    return reply.code(500).send({ message: err.message });
  }
};

exports.getNotifications = async (req, reply) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { limit = 30 } = req.query || {};

    const userRoleNames = await getUserRoles(userId);
    const query = buildRoleScopedQuery(userId, userRoleNames);

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    const unreadCount = await Notification.countDocuments({
      ...query,
      readBy: { $ne: userId }
    });

    return reply.send({
      notifications,
      unreadCount,
      roleNames: userRoleNames
    });
  } catch (err) {
    return reply.code(500).send({ message: err.message });
  }
};

exports.markAsRead = async (req, reply) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.user?._id;

    await Notification.findByIdAndUpdate(id, {
      $addToSet: { readBy: userId }
    });

    return reply.send({ success: true });
  } catch (err) {
    return reply.code(500).send({ message: err.message });
  }
};

exports.markAllAsRead = async (req, reply) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const userRoleNames = await getUserRoles(userId);
    const query = buildRoleScopedQuery(userId, userRoleNames);

    await Notification.updateMany(query, {
      $addToSet: { readBy: userId }
    });

    return reply.send({ success: true });
  } catch (err) {
    return reply.code(500).send({ message: err.message });
  }
};

exports.sendNotification = async (req, reply) => {
  try {
    const {
      title,
      body,
      type = 'GENERAL',
      department = null,
      targetRoles = [],
      data = {},
      token,
      recipientId
    } = req.body;

    if (!title || !body) {
      return reply.code(400).send({ message: 'Title and body are required' });
    }

    // 1. Save in database with role & department tags
    const newNotification = await Notification.create({
      title,
      body,
      type,
      department,
      targetRoles: Array.isArray(targetRoles) ? targetRoles : (targetRoles ? [targetRoles] : []),
      recipient: recipientId || null,
      data: data || {}
    });

    // 2. Gather FCM tokens
    let targetTokens = [];
    if (token) {
      targetTokens.push(token);
    } else if (recipientId) {
      const targetUser = await User.findById(recipientId);
      if (targetUser?.fcmTokens?.length) {
        targetTokens = targetUser.fcmTokens;
      }
    } else if (targetRoles && targetRoles.length > 0) {
      // Find users matching target roles
      const matchedRoles = await Role.find({ name: { $in: targetRoles } });
      const roleIds = matchedRoles.map(r => r._id);
      const targetUsers = await User.find({
        $or: [
          { role: { $in: roleIds } },
          { roles: { $in: roleIds } }
        ]
      }).select('fcmTokens');
      targetTokens = targetUsers.flatMap(u => u.fcmTokens || []);
    } else {
      // Broadcast to all active tokens in the system
      const users = await User.find({ 'fcmTokens.0': { $exists: true } }).select('fcmTokens');
      targetTokens = users.flatMap(u => u.fcmTokens || []);
    }

    // Deduplicate tokens
    targetTokens = [...new Set(targetTokens.filter(Boolean))];

    let pushResult = null;
    if (targetTokens.length > 0) {
      try {
        if (targetTokens.length === 1) {
          pushResult = await sendToDevice({
            token: targetTokens[0],
            notification: { title, body },
            data: { ...data, type, notificationId: String(newNotification._id) }
          });
        } else {
          pushResult = await sendMulticast({
            tokens: targetTokens,
            notification: { title, body },
            data: { ...data, type, notificationId: String(newNotification._id) }
          });
        }
      } catch (fcmErr) {
        console.warn('FCM Push Error (Notification saved in DB):', fcmErr.message);
        return reply.send({
          success: true,
          notification: newNotification,
          fcmWarning: fcmErr.message
        });
      }
    }

    return reply.send({
      success: true,
      notification: newNotification,
      pushResult
    });
  } catch (err) {
    return reply.code(500).send({ message: err.message });
  }
};

exports.sendTestNotification = async (req, reply) => {
  try {
    const { token } = req.body;
    const userId = req.user?.id || req.user?._id;
    const title = '🔔 Test Notification';
    const body = `Test notification dispatched at ${new Date().toLocaleTimeString()}`;

    return await exports.sendNotification({
      body: {
        title,
        body,
        type: 'SYSTEM',
        recipientId: userId,
        token,
        data: { timestamp: String(Date.now()), test: 'true' }
      },
      user: req.user
    }, reply);
  } catch (err) {
    return reply.code(500).send({ message: err.message });
  }
};
