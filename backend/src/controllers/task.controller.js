const taskService = require('../services/task.service');

const getTasks = async (req, res) => {
  try {
    const tasks = await taskService.getTasks(req.user.id);
    res.json(tasks);
  } catch (err) {
    console.error(err); res.status(500).json({ error: err.message });
  }
};

const createTask = async (req, res) => {
  try {
    const task = await taskService.createTask(req.user.id, req.body);
    res.status(201).json(task);
  } catch (err) {
    console.error(err); res.status(500).json({ error: err.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const task = await taskService.updateTask(req.params.id, req.body);
    res.json(task);
  } catch (err) {
    console.error(err); res.status(500).json({ error: err.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    await taskService.deleteTask(req.params.id);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error(err); res.status(500).json({ error: err.message });
  }
};

module.exports = { getTasks, createTask, updateTask, deleteTask };
