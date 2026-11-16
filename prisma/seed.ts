import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[Prisma Seed] Starting database seeding for Viber Hub...');

  // 1. System Admin User
  const adminPasswordHash = await bcrypt.hash('Admin1234!', 10);
  const user = await prisma.user.upsert({
    where: { email: 'admin@viberhub.local' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@viberhub.local',
      passwordHash: adminPasswordHash,
      displayName: 'System Admin',
      status: 'ACTIVE',
      mfaEnabled: false
    }
  });
  console.log(`[Prisma Seed] Verified admin user: ${user.email} (${user.id})`);

  // 2. Primary Workspace
  const workspace = await prisma.workspace.upsert({
    where: { id: '11111111-1111-1111-1111-111111111111' },
    update: {},
    create: {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Primary Organization',
      timezone: 'UTC',
      locale: 'en'
    }
  });
  console.log(`[Prisma Seed] Verified workspace: ${workspace.name} (${workspace.id})`);

  // 3. Workspace Membership
  const member = await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: user.id
      }
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      userId: user.id,
      role: 'OWNER',
      status: 'ACTIVE'
    }
  });

  // 4. Organizational Viber Account profile label (metadata only, no session tokens)
  const existingAccount = await prisma.viberAccount.findFirst({
    where: { workspaceId: workspace.id }
  });

  if (!existingAccount) {
    await prisma.viberAccount.create({
      data: {
        workspaceId: workspace.id,
        displayName: 'Corporate Dispatch Line',
        phoneLabel: '+1 (555) 019-2831',
        status: 'ACTIVE',
        notes: 'Main registered Viber dispatch number for communications'
      }
    });
  }

  // 5. Baseline Tags
  const vipTag = await prisma.tag.upsert({
    where: {
      workspaceId_name: {
        workspaceId: workspace.id,
        name: 'VIP Client'
      }
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      name: 'VIP Client',
      color: '#8b5cf6'
    }
  });

  const customerTag = await prisma.tag.upsert({
    where: {
      workspaceId_name: {
        workspaceId: workspace.id,
        name: 'Customer'
      }
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      name: 'Customer',
      color: '#3b82f6'
    }
  });

  const partnerTag = await prisma.tag.upsert({
    where: {
      workspaceId_name: {
        workspaceId: workspace.id,
        name: 'Partner'
      }
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      name: 'Partner',
      color: '#10b981'
    }
  });

  // 6. Sample Contacts
  const contact1 = await prisma.contact.upsert({
    where: {
      workspaceId_phoneE164: {
        workspaceId: workspace.id,
        phoneE164: '+447911123456'
      }
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      displayName: 'Elena Rostova',
      phoneOriginal: '+44 7911 123456',
      phoneE164: '+447911123456',
      email: 'elena@rostova-consulting.com',
      organization: 'Rostova Consulting',
      notes: 'Key account stakeholder for quarterly business updates',
      source: 'manual'
    }
  });

  // Consent Record for contact1
  const existingConsent = await prisma.consentRecord.findFirst({
    where: { contactId: contact1.id }
  });
  if (!existingConsent) {
    await prisma.consentRecord.create({
      data: {
        workspaceId: workspace.id,
        contactId: contact1.id,
        status: 'GRANTED',
        purpose: 'Monthly updates & account notifications',
        source: 'contract_agreement',
        evidenceRef: 'DOC-2026-MSA-04',
        recordedBy: user.id
      }
    });
  }

  // Tag link
  await prisma.contactTag.upsert({
    where: {
      contactId_tagId: {
        contactId: contact1.id,
        tagId: vipTag.id
      }
    },
    update: {},
    create: {
      contactId: contact1.id,
      tagId: vipTag.id
    }
  });

  // 7. Message Templates
  const template1 = await prisma.messageTemplate.create({
    data: {
      workspaceId: workspace.id,
      name: 'Executive Quarterly Briefing',
      category: 'announcement',
      body: 'Hello {{name}},\n\nHere is your quarterly briefing for {{company}}. We have released important updates for your account as of {{date}}.\n\nPlease find the attached summary document. Let us know if you have any questions.\n\nBest regards,\nViber Hub Team',
      createdBy: user.id,
      updatedBy: user.id
    }
  });

  // 8. Sample Destinations
  const dest1 = await prisma.destination.create({
    data: {
      workspaceId: workspace.id,
      type: 'INDIVIDUAL',
      displayName: 'Elena Rostova (Direct)',
      description: 'Direct 1-on-1 Viber conversation',
      contactId: contact1.id,
      notes: 'Active contact in phonebook'
    }
  });

  const dest2 = await prisma.destination.create({
    data: {
      workspaceId: workspace.id,
      type: 'GROUP',
      displayName: 'Strategic Accounts Working Group',
      description: 'Group of top tier client liaisons',
      notes: 'Operator is admin of this group'
    }
  });

  console.log('[Prisma Seed] Database seeded successfully.');
}

main()
  .catch((e) => {
    console.error('[Prisma Seed] Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
