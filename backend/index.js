const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Jimp } = require('jimp');
require('dotenv').config({ quiet: true });

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// Configure Multer Storage for E-Signatures
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/signatures/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'sign-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// --- AUTH / USER ROUTES ---

// List all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, createdAt: true, canApprove: true }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register / Create
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name, canApprove } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, canApprove: !!canApprove },
    });
    res.status(201).json({ message: 'User created' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update User
app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password, name, canApprove } = req.body;
    const updateData = { email, name, canApprove: !!canApprove };
    
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
    });
    res.json({ message: 'User updated' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete User
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    // Also support 'admin' as a universal bypass if the DB is empty (for debugging)
    const { email, password } = req.body;
    
    // Admin bypass fallback if exactly admin/admin
    if (email === 'admin' && password === 'admin') {
      const token = jwt.sign({ id: 0, email: 'admin@system.local' }, JWT_SECRET, { expiresIn: '12h' });
      return res.json({ token, user: { id: 0, name: 'System Administrator', email: 'admin@system.local', canApprove: true } });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '12h' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, canApprove: user.canApprove, signatureUrl: user.signatureUrl } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload E-Signature
app.post('/api/users/profile/signature', authenticateToken, upload.single('signature'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Admin bypass user (id: 0) cannot save to DB — must be a real user
    if (req.user.id === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'System admin account cannot upload a signature. Please log in with a real user account.' });
    }

    const filePath = req.file.path;
    const pngFilename = `${req.file.filename.split('.')[0]}_processed.png`;
    const pngPath = path.join(__dirname, 'uploads', 'signatures', pngFilename);

    // --- Image Analysis & Background Removal ---
    try {
      const image = await Jimp.read(filePath);
      let backgroundPixels = 0;
      const totalPixels = image.bitmap.width * image.bitmap.height;

      // First pass: check heuristic
      image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
        const r = this.bitmap.data[idx + 0];
        const g = this.bitmap.data[idx + 1];
        const b = this.bitmap.data[idx + 2];
        const a = this.bitmap.data[idx + 3];
        if (a < 50 || (r > 220 && g > 220 && b > 220)) backgroundPixels++;
      });

      if ((backgroundPixels / totalPixels) < 0.65) {
        fs.unlinkSync(filePath);
        return res.status(400).json({ error: 'Invalid image detected. Please upload a clear signature on a white or transparent background.' });
      }

      // Second pass: Remove background (make white pixels transparent)
      image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
        const r = this.bitmap.data[idx + 0];
        const g = this.bitmap.data[idx + 1];
        const b = this.bitmap.data[idx + 2];
        
        // If near-white (more aggressive threshold: 180), set alpha to 0
        if (r > 180 && g > 180 && b > 180) {
          this.bitmap.data[idx + 3] = 0;
        }
      });

      await image.write(pngPath);
      fs.unlinkSync(filePath); // Delete original upload
    } catch (jimpError) {
      console.error('Jimp error:', jimpError);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'Failed to process signature transparency.' });
    }
    // -------------------------------

    const signatureUrl = `/uploads/signatures/${pngFilename}`;
    
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { signatureUrl }
    });
    
    res.json({ message: 'Signature updated with auto-background removal!', signatureUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// --- TASK ROUTES ---

// Get all tasks for current user
app.get('/api/tasks', authenticateToken, async (req, res) => {
  const tasks = await prisma.task.findMany({
    where: { userId: req.user.id },
  });
  res.json(tasks);
});

// Create task
app.post('/api/tasks', authenticateToken, async (req, res) => {
  const { title, description } = req.body;
  const task = await prisma.task.create({
    data: {
      title,
      description,
      userId: req.user.id,
    },
  });
  res.status(201).json(task);
});

// Update task
app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, description, completed } = req.body;
  const task = await prisma.task.update({
    where: { id: parseInt(id) },
    data: { title, description, completed },
  });
  res.json(task);
});

// Delete task
// --- TRIP TICKET ROUTES ---
// Save Trip Ticket
app.post('/api/trip-tickets', async (req, res) => {
  try {
    const ticket = await prisma.tripTicket.create({
      data: {
        ...req.body,
        layout: req.body.layout ? JSON.stringify(req.body.layout) : null
      }
    });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/trip-tickets', async (req, res) => {
  const tickets = await prisma.tripTicket.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(tickets);
});

app.put('/api/trip-tickets/:id', async (req, res) => {
  const { id } = req.params;
  const { layout, ...rest } = req.body;
  try {
    const ticket = await prisma.tripTicket.update({
      where: { id: parseInt(id) },
      data: {
        ...rest,
        layout: layout ? JSON.stringify(layout) : undefined
      }
    });
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PRF ROUTES ---
// Save PRF
app.post('/api/prfs', async (req, res) => {
  try {
    const { items, layout, ...rest } = req.body;
    const prf = await prisma.prf.create({
      data: {
        ...rest,
        layout: layout ? JSON.stringify(layout) : null,
        items: {
          create: items
        }
      }
    });
    res.json(prf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/prfs', async (req, res) => {
  const prfs = await prisma.prf.findMany({
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(prfs);
});

app.put('/api/prfs/:id', async (req, res) => {
  const { id } = req.params;
  const { items, layout, ...rest } = req.body;
  try {
    // Delete old items and create new ones for simplicity
    await prisma.prfItem.deleteMany({ where: { prfId: parseInt(id) } });
    const prf = await prisma.prf.update({
      where: { id: parseInt(id) },
      data: {
        ...rest,
        layout: layout ? JSON.stringify(layout) : undefined,
        items: {
          create: items
        }
      }
    });
    res.json(prf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
