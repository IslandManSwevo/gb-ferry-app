import { CrewRole, Gender, IdentityDocType, PrismaClient, VesselType } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed script for development data
 * Run with: pnpm db:seed
 */
async function main() {
  console.log('🌱 Seeding database...');

  // Create demo user
  const demoUser = await prisma.user.upsert({
    where: { email: 'ops@gbferry.com' },
    update: {},
    create: {
      keycloakId: 'demo-keycloak-id',
      email: 'ops@gbferry.com',
      firstName: 'Operations',
      lastName: 'Staff',
      role: 'operations',
    },
  });

  console.log('✅ Created demo user:', demoUser.email);

  // Create demo vessel
  const vessel = await prisma.vessel.upsert({
    where: { imoNumber: 'IMO9876543' },
    update: {},
    create: {
      name: 'Grand Bahama Express',
      imoNumber: 'IMO9876543',
      officialNumber: 'BHS-001234',
      callSign: 'C6AB7',
      mmsi: '311234567',
      flagState: 'BHS',
      portOfRegistry: 'Freeport',
      type: VesselType.PASSENGER_FERRY,
      classificationSociety: 'Lloyd\'s Register',
      classNotation: '100A1',
      grossTonnage: 8500,
      netTonnage: 4200,
      lengthOverall: 125.5,
      breadth: 22.0,
      depth: 6.5,
      passengerCapacity: 500,
      crewCapacity: 45,
      vehicleCapacity: 120,
      engineType: 'Diesel',
      engineCount: 4,
      propulsionPower: 18000,
      yearBuilt: 2015,
      builder: 'Austal Ships',
      buildCountry: 'AUS',
    },
  });

  console.log('✅ Created demo vessel:', vessel.name);

  // Create vessel owner
  await prisma.vesselOwner.upsert({
    where: { id: 'owner-1' },
    update: {},
    create: {
      id: 'owner-1',
      vesselId: vessel.id,
      type: 'registered_owner',
      name: 'Grand Bahama Ferry Ltd.',
      ownerType: 'company',
      addressStreet: '123 Harbour Drive',
      addressCity: 'Freeport',
      addressCountry: 'BHS',
      contactEmail: 'admin@gbferry.com',
      contactPhone: '+1-242-555-0100',
      registrationNumber: 'BHS-2020-123456',
    },
  });

  // Create safe manning requirements
  const safeManning = await prisma.safeManningRequirement.upsert({
    where: { id: 'sm-1' },
    update: {},
    create: {
      id: 'sm-1',
      vesselId: vessel.id,
      documentNumber: 'SMD-2024-001',
      issueDate: new Date('2024-01-15'),
      expiryDate: new Date('2029-01-15'),
      issuingAuthority: 'Bahamas Maritime Authority',
    },
  });

  // Add manning roles
  const roles = [
    { role: CrewRole.MASTER, minimumCount: 1, certificateRequired: 'MASTER' },
    { role: CrewRole.CHIEF_OFFICER, minimumCount: 1, certificateRequired: 'CHIEF_MATE' },
    { role: CrewRole.DECK_OFFICER, minimumCount: 2, certificateRequired: 'OFFICER_OF_THE_WATCH_DECK' },
    { role: CrewRole.CHIEF_ENGINEER, minimumCount: 1, certificateRequired: 'CHIEF_ENGINEER' },
    { role: CrewRole.ENGINE_OFFICER, minimumCount: 2, certificateRequired: 'OFFICER_OF_THE_WATCH_ENGINE' },
    { role: CrewRole.ABLE_SEAMAN, minimumCount: 6, certificateRequired: 'ABLE_SEAFARER_DECK' },
    { role: CrewRole.RATING, minimumCount: 8, certificateRequired: 'BASIC_SAFETY_TRAINING' },
  ];

  for (const roleData of roles) {
    await prisma.safeManningRole.create({
      data: {
        safeManningId: safeManning.id,
        ...roleData,
      },
    });
  }

  console.log('✅ Created safe manning requirements');

  // Create demo crew member
  const crewMember = await prisma.crewMember.upsert({
    where: { id: 'crew-1' },
    update: {},
    create: {
      id: 'crew-1',
      familyName: 'JOHNSON',
      givenNames: 'Michael',
      dateOfBirth: new Date('1975-03-15'),
      placeOfBirth: 'Nassau, Bahamas',
      nationality: 'BHS',
      gender: Gender.M,
      passportNumber: 'ENCRYPTED_PLACEHOLDER', // Would be encrypted in production
      passportCountry: 'BHS',
      passportExpiry: new Date('2028-06-30'),
      seamanBookNumber: 'SRB-BHS-123456',
      seamanBookAuthority: 'Bahamas Maritime Authority',
      role: CrewRole.MASTER,
      vesselId: vessel.id,
      employmentStartDate: new Date('2018-01-01'),
      contractType: 'permanent',
      createdById: demoUser.id,
    },
  });

  // Add medical certificate
  await prisma.medicalCertificate.upsert({
    where: { crewId: crewMember.id },
    update: {},
    create: {
      crewId: crewMember.id,
      type: 'ENG_1',
      issuingAuthority: 'Maritime Medical Services',
      issueDate: new Date('2024-06-01'),
      expiryDate: new Date('2026-06-01'),
    },
  });

  // Add certifications
  const certifications = [
    { type: 'MASTER', certificateNumber: 'MAS-BHS-2020-001', expiryDate: new Date('2025-12-31') },
    { type: 'GMDSS_GOC', certificateNumber: 'GOC-BHS-2019-045', expiryDate: new Date('2024-12-31') },
    { type: 'BASIC_SAFETY_TRAINING', certificateNumber: 'BST-BHS-2023-189', expiryDate: new Date('2028-03-15') },
    { type: 'PASSENGER_SHIP_CROWD_MANAGEMENT', certificateNumber: 'PSCM-BHS-2022-067', expiryDate: new Date('2027-08-20') },
  ];

  for (const cert of certifications) {
    await prisma.certification.create({
      data: {
        crewId: crewMember.id,
        type: cert.type,
        certificateNumber: cert.certificateNumber,
        issuingAuthority: 'Bahamas Maritime Authority',
        issuingCountry: 'BHS',
        issueDate: new Date('2020-01-15'),
        expiryDate: cert.expiryDate,
        createdById: demoUser.id,
      },
    });
  }

  console.log('✅ Created demo crew member with certifications');

  // Create a demo sailing
  const sailing = await prisma.sailing.create({
    data: {
      vesselId: vessel.id,
      departurePort: 'Freeport, Grand Bahama',
      arrivalPort: 'Nassau, New Providence',
      departureTime: new Date('2026-01-03T14:00:00Z'),
      arrivalTime: new Date('2026-01-03T18:00:00Z'),
      status: 'scheduled',
    },
  });

  console.log('✅ Created demo sailing');

  // Create demo passengers
  const passengers = [
    {
      familyName: 'SMITH',
      givenNames: 'John Robert',
      dateOfBirth: new Date('1985-07-22'),
      nationality: 'USA',
      gender: Gender.M,
      identityDocType: IdentityDocType.PASSPORT,
      identityDocNumber: 'ENCRYPTED_123456789',
      identityDocCountry: 'USA',
      identityDocExpiry: new Date('2029-04-15'),
      portOfEmbarkation: 'Freeport',
      portOfDisembarkation: 'Nassau',
    },
    {
      familyName: 'WILLIAMS',
      givenNames: 'Sarah Elizabeth',
      dateOfBirth: new Date('1990-11-03'),
      nationality: 'BHS',
      gender: Gender.F,
      identityDocType: IdentityDocType.PASSPORT,
      identityDocNumber: 'ENCRYPTED_987654321',
      identityDocCountry: 'BHS',
      identityDocExpiry: new Date('2027-09-30'),
      portOfEmbarkation: 'Freeport',
      portOfDisembarkation: 'Nassau',
    },
  ];

  for (const pax of passengers) {
    await prisma.passenger.create({
      data: {
        sailingId: sailing.id,
        ...pax,
        consentGiven: true,
        consentTimestamp: new Date(),
        createdById: demoUser.id,
      },
    });
  }

  console.log('✅ Created demo passengers');

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
