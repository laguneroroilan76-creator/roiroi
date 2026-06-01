const reminderService = require('../services/reminder.service');

const getReminders = async (req, res) => {
  try {
    const reminders = await reminderService.getReminders(req.user.id);
    res.json(reminders);
  } catch (err) {
    console.error(err); res.status(500).json({ error: err.message });
  }
};

const upsertReminder = async (req, res) => {
  try {
    const reminder = await reminderService.upsertReminder(req.user.id, req.body);
    res.json(reminder);
  } catch (err) {
    console.error(err); res.status(500).json({ error: err.message });
  }
};

const deleteReminder = async (req, res) => {
  try {
    await reminderService.deleteReminder(req.params.id);
    res.json({ message: 'Reminder deleted' });
  } catch (err) {
    console.error(err); res.status(500).json({ error: err.message });
  }
};

module.exports = { getReminders, upsertReminder, deleteReminder };
