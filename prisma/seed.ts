// import { PrismaClient } from '../lib/generated/prisma'

// const prisma = new PrismaClient()

// async function main() {
//   // Create sample users with different roles
//   const admin = await prisma.user.upsert({
//     where: { email: 'admin@example.com' },
//     update: {},
//     create: {
//       email: 'admin@example.com',
//       name: 'Admin User',
//       password: 'hashedpassword123',
//       role: 'ADMIN',
//       isActive: true,
//     },
//   })

//   const client = await prisma.user.upsert({
//     where: { email: 'client@example.com' },
//     update: {},
//     create: {
//       email: 'client@example.com',
//       name: 'John Client',
//       password: 'hashedpassword123',
//       role: 'CLIENT',
//       isActive: true,
//     },
//   })

//   const projectManager = await prisma.user.upsert({
//     where: { email: 'pm@example.com' },
//     update: {},
//     create: {
//       email: 'pm@example.com',
//       name: 'Sarah Project Manager',
//       password: 'hashedpassword123',
//       role: 'PROJECT_MANAGER',
//       isActive: true,
//     },
//   })

//   const teamMember = await prisma.user.upsert({
//     where: { email: 'dev@example.com' },
//     update: {},
//     create: {
//       email: 'dev@example.com',
//       name: 'Mike Developer',
//       password: 'hashedpassword123',
//       role: 'TEAM_MEMBER',
//       isActive: true,
//     },
//   })

//   // Create sample projects
//   const project1 = await prisma.project.upsert({
//     where: { id: 'project-1' },
//     update: {},
//     create: {
//       id: 'project-1',
//       name: 'Website Redesign',
//       description: 'Complete website redesign for client',
//       status: 'IN_PROGRESS',
//       budget: 15000,
//       startDate: new Date('2024-01-01'),
//       endDate: new Date('2024-03-31'),
//       clientId: client.id,
//       managerId: projectManager.id,
//     },
//   })

//   const project2 = await prisma.project.upsert({
//     where: { id: 'project-2' },
//     update: {},
//     create: {
//       id: 'project-2',
//       name: 'Mobile App Development',
//       description: 'iOS and Android mobile application',
//       status: 'PLANNING',
//       budget: 25000,
//       startDate: new Date('2024-02-01'),
//       endDate: new Date('2024-06-30'),
//       clientId: client.id,
//       managerId: projectManager.id,
//     },
//   })

//   // Create sample invoices
//   const invoice1 = await prisma.invoice.upsert({
//     where: { id: 'invoice-1' },
//     update: {},
//     create: {
//       id: 'invoice-1',
//       invoiceNumber: 'INV-2024-001',
//       amount: 5000,
//       currency: 'USD',
//       dueDate: new Date('2024-02-15'),
//       status: 'PAID',
//       notes: 'First milestone payment for website redesign',
//       paidAt: new Date('2024-02-10'),
//       paymentLink: 'https://stripe.com/pay/inv_001',
//       clientId: client.id,
//       projectId: project1.id,
//     },
//   })

//   const invoice2 = await prisma.invoice.upsert({
//     where: { id: 'invoice-2' },
//     update: {},
//     create: {
//       id: 'invoice-2',
//       invoiceNumber: 'INV-2024-002',
//       amount: 8000,
//       currency: 'USD',
//       dueDate: new Date('2024-03-01'),
//       status: 'SENT',
//       notes: 'Second milestone payment for website redesign',
//       paymentLink: 'https://stripe.com/pay/inv_002',
//       clientId: client.id,
//       projectId: project1.id,
//     },
//   })

//   const invoice3 = await prisma.invoice.upsert({
//     where: { id: 'invoice-3' },
//     update: {},
//     create: {
//       id: 'invoice-3',
//       invoiceNumber: 'INV-2024-003',
//       amount: 12500,
//       currency: 'USD',
//       dueDate: new Date('2024-01-20'),
//       status: 'OVERDUE',
//       notes: 'Initial payment for mobile app development',
//       paymentLink: 'https://stripe.com/pay/inv_003',
//       clientId: client.id,
//       projectId: project2.id,
//     },
//   })

//   const invoice4 = await prisma.invoice.upsert({
//     where: { id: 'invoice-4' },
//     update: {},
//     create: {
//       id: 'invoice-4',
//       invoiceNumber: 'INV-2024-004',
//       amount: 2000,
//       currency: 'USD',
//       dueDate: new Date('2024-02-28'),
//       status: 'PENDING',
//       notes: 'Consultation fee for project planning',
//       paymentLink: 'https://stripe.com/pay/inv_004',
//       clientId: client.id,
//       projectId: project2.id,
//     },
//   })

//   console.log('Seed data created successfully!')
//   console.log('Users:', { admin: admin.email, client: client.email, pm: projectManager.email, dev: teamMember.email })
//   console.log('Projects:', { project1: project1.name, project2: project2.name })
//   console.log('Invoices:', { 
//     paid: invoice1.invoiceNumber, 
//     sent: invoice2.invoiceNumber, 
//     overdue: invoice3.invoiceNumber, 
//     pending: invoice4.invoiceNumber 
//   })
// }

// main()
//   .catch((e) => {
//     console.error(e)
//     process.exit(1)
//   })
//   .finally(async () => {
//     await prisma.$disconnect()
//   })
