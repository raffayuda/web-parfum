import { Elysia } from 'elysia';
import {
  RETENTION_DAYS,
  createDatabaseBackup,
  deleteBackupById,
  ensureDailyBackupAndPrune,
  getBackupJsonById,
  listBackups,
  pruneExpiredBackups,
} from '../utils/backup';

export const backupsRoute = new Elysia({ prefix: '/backups' })
  // List backups (also ensures daily backup exists & prunes > 7 days automatically)
  .get('/', async ({ set }) => {
    try {
      const syncInfo = await ensureDailyBackupAndPrune();
      const backups = await listBackups();

      return {
        success: true,
        retentionDays: RETENTION_DAYS,
        createdToday: syncInfo.createdToday,
        prunedCount: syncInfo.prunedCount,
        data: backups,
      };
    } catch (e: any) {
      set.status = 500;
      return { success: false, message: e.message || 'Gagal memuat daftar backup.' };
    }
  })

  // Vercel Cron daily trigger (02:00 UTC / 09:00 WIB)
  .get('/cron', async ({ request, set }) => {
    try {
      const cronSecret = process.env.CRON_SECRET?.trim();
      if (cronSecret) {
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${cronSecret}`) {
          set.status = 401;
          return { success: false, message: 'Unauthorized cron request' };
        }
      }

      const result = await ensureDailyBackupAndPrune();
      return {
        success: true,
        message: 'Daily database backup & 7-day retention cleanup executed.',
        ...result,
      };
    } catch (e: any) {
      set.status = 500;
      return { success: false, message: e.message };
    }
  })

  // Manual backup trigger from Admin Dashboard
  .post('/run', async ({ set }) => {
    try {
      const created = await createDatabaseBackup('manual');
      return {
        success: true,
        message: 'Backup database manual berhasil dibuat.',
        data: created,
      };
    } catch (e: any) {
      set.status = 500;
      return { success: false, message: e.message || 'Gagal membuat backup database.' };
    }
  })

  // Manual prune trigger (> 7 days)
  .post('/prune', async ({ set }) => {
    try {
      const deletedCount = await pruneExpiredBackups(RETENTION_DAYS);
      return {
        success: true,
        deletedCount,
        message:
          deletedCount > 0
            ? `${deletedCount} backup yang melewati ${RETENTION_DAYS} hari berhasil dihapus.`
            : `Tidak ada backup yang melewati batas ${RETENTION_DAYS} hari.`,
      };
    } catch (e: any) {
      set.status = 500;
      return { success: false, message: e.message };
    }
  })

  // Download decompressed JSON snapshot
  .get('/:id/download', async ({ params: { id }, set }) => {
    try {
      const file = await getBackupJsonById(id);
      if (!file) {
        set.status = 404;
        return { success: false, message: 'Backup tidak ditemukan.' };
      }

      return new Response(file.jsonString, {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="${file.filename}"`,
        },
      });
    } catch (e: any) {
      set.status = 500;
      return { success: false, message: e.message || 'Gagal mengunduh backup.' };
    }
  })

  // Delete specific backup
  .delete('/:id', async ({ params: { id }, set }) => {
    try {
      const deleted = await deleteBackupById(id);
      if (!deleted) {
        set.status = 404;
        return { success: false, message: 'Backup tidak ditemukan.' };
      }

      return { success: true, message: 'Backup berhasil dihapus.' };
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  });
