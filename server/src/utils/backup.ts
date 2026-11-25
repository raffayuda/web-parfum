import { gzipSync, gunzipSync } from 'zlib';
import { SectionTemplate } from '@prisma/client';
import { prisma } from '../db';

export const BACKUP_PAGE_SLUG = 'db-backups';
export const RETENTION_DAYS = 7;

export interface BackupStats {
  users: number;
  fragrances: number;
  orders: number;
  certifications: number;
  pages: number;
}

export interface BackupRecordMeta {
  id: string;
  name: string;
  backupDate: string;
  createdAt: string;
  trigger: 'auto' | 'manual';
  stats: BackupStats;
  sizeBytes: number;
  expiresAt: string;
}

export function getJakartaDateKey(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

async function getOrCreateBackupContainerPage() {
  let page = await prisma.page.findUnique({
    where: { slug: BACKUP_PAGE_SLUG },
    include: {
      sections: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!page) {
    page = await prisma.page.create({
      data: {
        slug: BACKUP_PAGE_SLUG,
        title: 'Database Backups',
        description: 'Snapshot backup database harian otomatis dengan retensi 7 hari.',
        isActive: false,
      },
      include: {
        sections: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  return page;
}

export async function pruneExpiredBackups(retentionDays = RETENTION_DAYS): Promise<number> {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  const page = await prisma.page.findUnique({
    where: { slug: BACKUP_PAGE_SLUG },
    select: { id: true },
  });

  if (!page) return 0;

  const result = await prisma.pageSection.deleteMany({
    where: {
      pageId: page.id,
      createdAt: { lt: cutoff },
    },
  });

  return result.count;
}

export async function createDatabaseBackup(
  trigger: 'auto' | 'manual' = 'manual'
): Promise<BackupRecordMeta> {
  const page = await getOrCreateBackupContainerPage();
  const now = new Date();
  const backupDate = getJakartaDateKey(now);

  const [users, fragrances, orders, certifications, pages] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        emailVerified: true,
        memberStatus: true,
        memberTier: true,
        memberSince: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.fragrance.findMany(),
    prisma.order.findMany({
      include: { items: true },
    }),
    prisma.certification.findMany(),
    prisma.page.findMany({
      where: { slug: { not: BACKUP_PAGE_SLUG } },
      include: { sections: true },
    }),
  ]);

  const stats: BackupStats = {
    users: users.length,
    fragrances: fragrances.length,
    orders: orders.length,
    certifications: certifications.length,
    pages: pages.length,
  };

  const snapshot = {
    version: '1.0',
    app: 'OMOO',
    backupDate,
    exportedAt: now.toISOString(),
    trigger,
    stats,
    tables: {
      users,
      fragrances,
      orders,
      certifications,
      pages,
    },
  };

  const compressedBuffer = gzipSync(Buffer.from(JSON.stringify(snapshot), 'utf-8'));
  const compressedGzipBase64 = compressedBuffer.toString('base64');
  const sizeBytes = compressedBuffer.length;
  const expiresAt = new Date(now.getTime() + RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const created = await prisma.pageSection.create({
    data: {
      pageId: page.id,
      name: `Backup ${backupDate} (${trigger === 'auto' ? 'Otomatis' : 'Manual'})`,
      template: SectionTemplate.RICH_TEXT_MEDIA,
      order: Math.floor(now.getTime() / 1000),
      isActive: true,
      contentData: {
        backupDate,
        createdAt: now.toISOString(),
        trigger,
        stats,
        sizeBytes,
        expiresAt,
        compressedGzipBase64,
      } as any,
    },
  });

  await pruneExpiredBackups(RETENTION_DAYS);

  return {
    id: created.id,
    name: created.name,
    backupDate,
    createdAt: now.toISOString(),
    trigger,
    stats,
    sizeBytes,
    expiresAt,
  };
}

export async function ensureDailyBackupAndPrune(): Promise<{
  createdToday: boolean;
  prunedCount: number;
}> {
  const prunedCount = await pruneExpiredBackups(RETENTION_DAYS);
  const page = await getOrCreateBackupContainerPage();
  const todayKey = getJakartaDateKey();

  const hasTodayBackup = page.sections.some((sec) => {
    const content = (sec.contentData as any) || {};
    return content.backupDate === todayKey || getJakartaDateKey(sec.createdAt) === todayKey;
  });

  if (!hasTodayBackup) {
    await createDatabaseBackup('auto');
    return { createdToday: true, prunedCount };
  }

  return { createdToday: false, prunedCount };
}

export async function listBackups(): Promise<BackupRecordMeta[]> {
  const page = await prisma.page.findUnique({
    where: { slug: BACKUP_PAGE_SLUG },
    include: {
      sections: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!page) return [];

  return page.sections.map((sec) => {
    const content = (sec.contentData as any) || {};
    const createdAt = content.createdAt || sec.createdAt.toISOString();
    const expiresAt =
      content.expiresAt ||
      new Date(sec.createdAt.getTime() + RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

    return {
      id: sec.id,
      name: sec.name,
      backupDate: content.backupDate || getJakartaDateKey(sec.createdAt),
      createdAt,
      trigger: content.trigger === 'auto' ? 'auto' : 'manual',
      stats: content.stats || {
        users: 0,
        fragrances: 0,
        orders: 0,
        certifications: 0,
        pages: 0,
      },
      sizeBytes: Number(content.sizeBytes) || 0,
      expiresAt,
    };
  });
}

export async function getBackupJsonById(id: string): Promise<{
  filename: string;
  jsonString: string;
} | null> {
  const section = await prisma.pageSection.findUnique({
    where: { id },
    include: { page: { select: { slug: true } } },
  });

  if (!section || section.page.slug !== BACKUP_PAGE_SLUG) {
    return null;
  }

  const content = (section.contentData as any) || {};
  if (!content.compressedGzipBase64) {
    return null;
  }

  const rawBuffer = gunzipSync(Buffer.from(content.compressedGzipBase64, 'base64'));
  const backupDate = content.backupDate || getJakartaDateKey(section.createdAt);

  return {
    filename: `omoo-db-backup-${backupDate}.json`,
    jsonString: rawBuffer.toString('utf-8'),
  };
}

export async function deleteBackupById(id: string): Promise<boolean> {
  const section = await prisma.pageSection.findUnique({
    where: { id },
    include: { page: { select: { slug: true } } },
  });

  if (!section || section.page.slug !== BACKUP_PAGE_SLUG) {
    return false;
  }

  await prisma.pageSection.delete({ where: { id } });
  return true;
}
