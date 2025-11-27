import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  console.log('A criar utilizador inicial...');

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'secretaria@escola.pt' },
    update: {},
    create: {
      email: 'secretaria@escola.pt',
      password: hashedPassword,
      name: 'Secretaria',
      employeeNumber: 'SEC001',
      role: 'SECRETARIA',
    },
  });

  console.log('Utilizador criado:', admin);

  const professor = await prisma.user.upsert({
    where: { email: 'professor@escola.pt' },
    update: {},
    create: {
      email: 'professor@escola.pt',
      password: hashedPassword,
      name: 'Professor Teste',
      employeeNumber: 'PROF001',
      role: 'PROFESSOR',
    },
  });

  console.log('Professor criado:', professor);

  // Criar algumas salas de exemplo
  const sala1 = await prisma.room.upsert({
    where: { number: 'A101' },
    update: {},
    create: {
      name: 'Sala A101',
      number: 'A101',
    },
  });

  const sala2 = await prisma.room.upsert({
    where: { number: 'B205' },
    update: {},
    create: {
      name: 'Sala B205',
      number: 'B205',
    },
  });

  console.log('Salas criadas:', sala1, sala2);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

