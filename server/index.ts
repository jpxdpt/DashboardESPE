import dotenv from 'dotenv';
import { resolve } from 'path';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Types
interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

interface PrismaError extends Error {
  code?: string;
}

interface RequestWithUser extends express.Request {
  user?: JwtPayload;
}

// Load environment variables - try multiple approaches
dotenv.config({ path: resolve(process.cwd(), '.env') });

// If still not loaded, try default location
if (!process.env.DATABASE_URL) {
  dotenv.config();
}

// Verify DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL not found in environment variables');
  console.error('Current working directory:', process.cwd());
  console.error('Tried to load from:', resolve(process.cwd(), '.env'));
  process.exit(1);
}

console.log('DATABASE_URL loaded successfully');

// Initialize Prisma Client with explicit database URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});
const app = express();
const httpServer = createServer(app);

// CORS configuration - supports multiple origins via environment variable
const corsOrigin = process.env.CORS_ORIGIN || process.env.VITE_API_URL?.replace('/api', '') || "http://localhost:5173";
const allowedOrigins = corsOrigin.split(',').map(origin => origin.trim());

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true,
    allowedHeaders: ["*"],
  },
  transports: ['websocket', 'polling'],
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

app.use(cors({
  origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());

// Middleware to verify JWT token
const authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de autenticação necessário' });
  }

  jwt.verify(token, JWT_SECRET, (err: Error | null, user: JwtPayload | undefined) => {
    if (err || !user) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    (req as RequestWithUser).user = user;
    next();
  });
};

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  console.log('Total connections:', io.sockets.sockets.size);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    console.log('Total connections:', io.sockets.sockets.size);
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, employeeNumber, role } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'Email, palavra-passe, nome e tipo são obrigatórios' });
    }

    // Allow any role to be created - no restrictions
    const finalRole = role;

    const hashedPassword = await bcrypt.hash(password, 10);

    // Prepare data object, only include employeeNumber if it's not empty
    const userData: any = {
      email,
      password: hashedPassword,
      name,
      role: finalRole,
    };

    if (employeeNumber && employeeNumber.trim() !== '') {
      userData.employeeNumber = employeeNumber.trim();
    }

    const user = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        email: true,
        name: true,
        employeeNumber: true,
        role: true,
        createdAt: true,
      },
    });

    res.json({ message: 'Conta criada com sucesso', user });
  } catch (error) {
    console.error('Registration error:', error);
    const prismaError = error as PrismaError;
    if (prismaError.code === 'P2002') {
      return res.status(400).json({ error: 'Já existe um utilizador com este email ou número de funcionário' });
    }
    res.status(500).json({ error: prismaError.message || 'Erro interno do servidor' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('Login attempt for email:', req.body?.email);
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e palavra-passe são obrigatórios' });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      employeeNumber: user.employeeNumber,
      role: user.role
    };

    console.log('Login successful - User role:', user.role);
    console.log('Login response user:', userResponse);

    res.json({
      token,
      user: userResponse
    });
  } catch (error) {
    const err = error as Error;
    console.error('Login error:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: err.message || 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Alerts routes
app.get('/api/alerts', authenticateToken, async (req, res) => {
  try {
    const alerts = await prisma.alert.findMany({
      include: {
        professor: { select: { id: true, name: true, email: true } },
        room: { select: { id: true, name: true, number: true } },
        resolvedBy: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/alerts', authenticateToken, async (req, res) => {
  try {
    const { userId, roomId } = req.body;
    const alert = await prisma.alert.create({
      data: {
        userId,
        roomId,
        status: 'PENDING'
      },
      include: {
        professor: { select: { id: true, name: true, email: true } },
        room: { select: { id: true, name: true, number: true } }
      }
    });
    
    // Emit to all connected clients
    io.emit('alert:new', alert);
    
    res.json(alert);
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.patch('/api/alerts/:id/resolve', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { resolvedById } = req.body;
    
    const alert = await prisma.alert.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolvedById
      },
      include: {
        professor: { select: { id: true, name: true, email: true } },
        room: { select: { id: true, name: true, number: true } },
        resolvedBy: { select: { id: true, name: true } }
      }
    });
    
    io.emit('alert:resolved', alert);
    
    res.json(alert);
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rooms routes
app.get('/api/rooms', authenticateToken, async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/rooms', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Nome da sala é obrigatório' });
    }

    // Use name as number (or generate a unique number from name)
    const number = name.trim();

    const room = await prisma.room.create({
      data: { name: name.trim(), number }
    });
    res.json(room);
  } catch (error) {
    const prismaError = error as PrismaError;
    if (prismaError.code === 'P2002') {
      return res.status(400).json({ error: 'Já existe uma sala com este nome' });
    }
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.put('/api/rooms/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Nome da sala é obrigatório' });
    }

    // Use name as number
    const number = name.trim();

    const room = await prisma.room.update({
      where: { id },
      data: { name: name.trim(), number }
    });
    res.json(room);
  } catch (error) {
    const prismaError = error as PrismaError;
    if (prismaError.code === 'P2002') {
      return res.status(400).json({ error: 'Já existe uma sala com este nome' });
    }
    console.error('Error updating room:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.delete('/api/rooms/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.room.delete({
      where: { id }
    });
    res.json({ message: 'Sala eliminada com sucesso' });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Users routes
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        employeeNumber: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/users', authenticateToken, async (req, res) => {
  try {
    const { email, password, name, employeeNumber, role } = req.body;
    
    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'Email, palavra-passe, nome e tipo são obrigatórios' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        employeeNumber,
        role
      },
      select: {
        id: true,
        email: true,
        name: true,
        employeeNumber: true,
        role: true,
        createdAt: true
      }
    });
    res.json(user);
  } catch (error) {
    const prismaError = error as PrismaError;
    if (prismaError.code === 'P2002') {
      return res.status(400).json({ error: 'Já existe um utilizador com este email ou número de funcionário' });
    }
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.io server ready`);
  console.log(`CORS enabled for: ${corsOrigin}`);
});
