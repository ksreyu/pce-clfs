const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.findUnique({where:{email:'admin@college.edu'}})
  .then(u => { console.log('User found:', u ? u.name : 'NOT FOUND'); console.log('Role:', u.role); p.$disconnect(); })
  .catch(e => { console.error('Error:', e.message); p.$disconnect(); });
