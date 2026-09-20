import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { calculateMatchScore } from '../src/utils/matching';

const prisma = new PrismaClient();

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function main() {
  console.log('Seeding database for Pillai College of Engineering...');

  const salt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash('admin123', salt);
  const studentHash = await bcrypt.hash('student123', salt);

  const admin = await prisma.user.create({
    data: {
      name: 'Dr. Admin User',
      email: 'admin@mes.ac.in',
      studentId: 'FAC001',
      phone: '9876543210',
      department: 'Administration',
      year: 'N/A',
      passwordHash: adminHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  const rahul = await prisma.user.create({
    data: {
      name: 'Rahul Sharma',
      email: 'rahul@student.mes.ac.in',
      studentId: '2023PE0080',
      phone: '9876543211',
      department: 'Computer Engineering',
      year: '3rd Year',
      passwordHash: studentHash,
      role: 'USER',
      status: 'ACTIVE',
    },
  });

  const priya = await prisma.user.create({
    data: {
      name: 'Priya Patel',
      email: 'priya@student.mes.ac.in',
      studentId: '2024IT0045',
      phone: '9876543212',
      department: 'Information Technology',
      year: '2nd Year',
      passwordHash: studentHash,
      role: 'USER',
      status: 'ACTIVE',
    },
  });

  const amit = await prisma.user.create({
    data: {
      name: 'Amit Kumar',
      email: 'amit@student.mes.ac.in',
      studentId: '2022ME0033',
      phone: '9876543213',
      department: 'Mechanical Engineering',
      year: '4th Year',
      passwordHash: studentHash,
      role: 'USER',
      status: 'ACTIVE',
    },
  });

  const sneha = await prisma.user.create({
    data: {
      name: 'Sneha Reddy',
      email: 'sneha@student.mes.ac.in',
      studentId: '2025EC0012',
      phone: '9876543214',
      department: 'Electronics & Computer Science',
      year: '1st Year',
      passwordHash: studentHash,
      role: 'USER',
      status: 'ACTIVE',
    },
  });

  console.log('Users created.');

  const lostItem1 = await prisma.item.create({
    data: {
      itemCode: 'LOST-001',
      type: 'LOST',
      name: 'Black Dell Laptop',
      category: 'Electronics',
      description: 'Dell Inspiron 15 laptop, black color, with a small scratch on the lid. Has CS project files.',
      date: daysAgo(3),
      time: '2:30 PM',
      location: 'PCE Library (2nd Floor)',
      color: 'Black',
      brand: 'Dell',
      model: 'Inspiron 15',
      identifyingFeatures: 'Small scratch on lid, CS stickers on back',
      status: 'LOST',
      reportedById: rahul.id,
    },
  });

  const lostItem2 = await prisma.item.create({
    data: {
      itemCode: 'LOST-002',
      type: 'LOST',
      name: 'Blue College Backpack',
      category: 'Bags',
      description: 'Navy blue Jansport backpack with textbooks and notebook inside.',
      date: daysAgo(2),
      time: '11:00 AM',
      location: 'PCE Cafeteria',
      color: 'Blue',
      brand: 'Jansport',
      model: 'SuperBreak',
      identifyingFeatures: 'Keychain on zipper, faded corner',
      status: 'LOST',
      reportedById: priya.id,
    },
  });

  const lostItem3 = await prisma.item.create({
    data: {
      itemCode: 'LOST-003',
      type: 'LOST',
      name: 'Student ID Card',
      category: 'ID Cards',
      description: 'College ID card with name Rahul Sharma. Lost somewhere on campus.',
      date: daysAgo(1),
      time: '4:00 PM',
      location: 'Lecture Hall 101',
      color: 'White',
      brand: '',
      model: '',
      identifyingFeatures: 'Photo on front, barcode on back',
      status: 'LOST',
      reportedById: rahul.id,
    },
  });

  const lostItem4 = await prisma.item.create({
    data: {
      itemCode: 'LOST-004',
      type: 'LOST',
      name: 'Wireless Earbuds',
      category: 'Electronics',
      description: 'Sony WF-1000XM4 wireless earbuds in black charging case.',
      date: daysAgo(5),
      time: '1:00 PM',
      location: 'Computer Lab 3',
      color: 'Black',
      brand: 'Sony',
      model: 'WF-1000XM4',
      identifyingFeatures: "Case has 'RAHUL' engraved on bottom",
      status: 'LOST',
      reportedById: rahul.id,
    },
  });

  console.log('Lost items created.');

  const foundItem1 = await prisma.item.create({
    data: {
      itemCode: 'FOUND-001',
      type: 'FOUND',
      name: 'Black Laptop',
      category: 'Electronics',
      description: 'Found a black Dell laptop near the library entrance. Looks like an Inspiron model.',
      date: daysAgo(2),
      time: '5:00 PM',
      location: 'PCE Library (Ground Floor)',
      color: 'Black',
      brand: 'Dell',
      model: 'Inspiron',
      identifyingFeatures: 'Scratch on lid, has some stickers',
      status: 'FOUND',
      reportedById: amit.id,
    },
  });

  const foundItem2 = await prisma.item.create({
    data: {
      itemCode: 'FOUND-002',
      type: 'FOUND',
      name: 'Blue Backpack',
      category: 'Bags',
      description: 'Blue Jansport backpack found under a table in the cafeteria.',
      date: daysAgo(1),
      time: '3:30 PM',
      location: 'PCE Cafeteria',
      color: 'Blue',
      brand: 'Jansport',
      model: 'SuperBreak',
      identifyingFeatures: 'Has a keychain, one corner is slightly faded',
      status: 'FOUND',
      reportedById: sneha.id,
    },
  });

  const foundItem3 = await prisma.item.create({
    data: {
      itemCode: 'FOUND-003',
      type: 'FOUND',
      name: 'Student ID Card',
      category: 'ID Cards',
      description: 'Found a student ID card near Lecture Hall 101 entrance.',
      date: daysAgo(1),
      time: '6:00 PM',
      location: 'Lecture Hall 101',
      color: 'White',
      brand: '',
      model: '',
      identifyingFeatures: 'ID card with photo, looks new',
      status: 'FOUND',
      reportedById: sneha.id,
    },
  });

  const foundItem4 = await prisma.item.create({
    data: {
      itemCode: 'FOUND-004',
      type: 'FOUND',
      name: 'Calculator',
      category: 'Electronics',
      description: 'Casio scientific calculator found in Computer Lab 3.',
      date: daysAgo(4),
      time: '2:00 PM',
      location: 'Computer Lab 3',
      color: 'Black',
      brand: 'Casio',
      model: 'fx-991EX',
      identifyingFeatures: 'Name written on back in marker',
      status: 'FOUND',
      reportedById: amit.id,
    },
  });

  console.log('Found items created.');

  const lostItems = [lostItem1, lostItem2, lostItem3, lostItem4];
  const foundItems = [foundItem1, foundItem2, foundItem3, foundItem4];

  const matchThreshold = 60;

  for (const lost of lostItems) {
    for (const found of foundItems) {
      const { score, reason } = calculateMatchScore(
        {
          category: lost.category,
          name: lost.name,
          location: lost.location,
          date: lost.date.toISOString(),
          color: lost.color || undefined,
          brand: lost.brand || undefined,
          model: lost.model || undefined,
          description: lost.description,
          identifyingFeatures: lost.identifyingFeatures || undefined,
        },
        {
          category: found.category,
          name: found.name,
          location: found.location,
          date: found.date.toISOString(),
          color: found.color || undefined,
          brand: found.brand || undefined,
          model: found.model || undefined,
          description: found.description,
          identifyingFeatures: found.identifyingFeatures || undefined,
        }
      );

      if (score >= matchThreshold) {
        await prisma.match.create({
          data: {
            lostItemId: lost.id,
            foundItemId: found.id,
            score,
            reason,
            status: 'PENDING',
          },
        });
        console.log(`Match created: ${lost.name} <-> ${found.name} (score: ${score})`);
      }
    }
  }

  console.log('Matching complete.');

  const claim = await prisma.claim.create({
    data: {
      itemId: foundItem1.id,
      claimantId: rahul.id,
      explanation: 'This is my Dell laptop. It has a scratch on the lid and CS project files. I lost it in the PCE Library 3 days ago.',
      lostDate: daysAgo(3),
      lostLocation: 'PCE Library (2nd Floor)',
      identifyingDetails: 'Small scratch on lid, CS stickers on back, Dell Inspiron 15 black color',
      status: 'PENDING',
    },
  });

  console.log('Claim created.');

  await prisma.notification.create({
    data: {
      userId: rahul.id,
      title: 'Potential Match Found',
      message: 'A found item matching your lost Black Dell Laptop has been identified',
      type: 'MATCH_FOUND',
      relatedItemId: lostItem1.id,
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: amit.id,
      title: 'Claim Received',
      message: 'Someone has submitted a claim for the Black Laptop you found',
      type: 'CLAIM_SUBMITTED',
      relatedItemId: foundItem1.id,
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: priya.id,
      title: 'Potential Match Found',
      message: 'A found item matching your lost Blue College Backpack has been identified',
      type: 'MATCH_FOUND',
      relatedItemId: lostItem2.id,
      isRead: false,
    },
  });

  console.log('Notifications created.');

  console.log('Database seeded successfully!');
  console.log('\n=== Demo Credentials ===');
  console.log('Admin:    admin@mes.ac.in / admin123');
  console.log('Student:  rahul@student.mes.ac.in / student123');
  console.log('Student:  priya@student.mes.ac.in / student123');
  console.log('Student:  amit@student.mes.ac.in / student123');
  console.log('Student:  sneha@student.mes.ac.in / student123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
