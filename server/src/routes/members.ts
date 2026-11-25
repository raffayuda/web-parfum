import { Elysia, t } from 'elysia';
import { MemberStatus, UserRole } from '@prisma/client';
import { auth } from '../auth';
import { prisma } from '../db';
import {
  buildLoyaltySummary,
  getLoyaltyConfig,
  saveLoyaltyConfig,
  syncUserLoyalty,
} from '../utils/loyalty';

export const membersRoute = new Elysia({ prefix: '/members' })
  // Admin / Public: get current loyalty configuration rules
  .get('/config', async ({ set }) => {
    try {
      const config = await getLoyaltyConfig();
      return { success: true, data: config };
    } catch (e: any) {
      set.status = 500;
      return { success: false, message: e.message };
    }
  })

  // Admin: update loyalty & Collector VIP rules
  .put('/config', async ({ body, set }) => {
    try {
      const saved = await saveLoyaltyConfig(body);
      return {
        success: true,
        message: 'Aturan membership & Collector VIP berhasil diperbarui.',
        data: saved,
      };
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message || 'Gagal menyimpan aturan loyalty.' };
    }
  })

  // Customer endpoint: current authenticated user's automatic loyalty status & progress
  .get('/status', async ({ request, set }) => {
    try {
      const [session, config] = await Promise.all([
        auth.api.getSession({ headers: request.headers }),
        getLoyaltyConfig(),
      ]);

      if (!session) {
        return {
          success: true,
          authenticated: false,
          user: null,
          loyalty: buildLoyaltySummary(0, 0, null, config),
        };
      }

      const loyalty = await syncUserLoyalty(session.user.id);
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          memberStatus: true,
          memberTier: true,
          memberSince: true,
        },
      });

      return {
        success: true,
        authenticated: true,
        user,
        loyalty: loyalty ?? buildLoyaltySummary(0, 0, null, config),
      };
    } catch (e: any) {
      set.status = 500;
      return { success: false, message: e.message };
    }
  })

  // Admin endpoint: list all non-admin members with calculated spend & automatic tier
  .get('/', async ({ query, set }) => {
    try {
      const { tier } = query as { tier?: string };
      const config = await getLoyaltyConfig();

      const [users, qualifyingOrders] = await Promise.all([
        prisma.user.findMany({
          where: { role: { not: UserRole.ADMIN } },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            memberStatus: true,
            memberTier: true,
            memberSince: true,
            createdAt: true,
          },
        }),
        prisma.order.findMany({
          where: {
            status: { in: config.qualifyingStatuses },
          },
          select: {
            userId: true,
            customerEmail: true,
            totalAmount: true,
          },
        }),
      ]);

      const spendByUserId = new Map<string, { total: number; count: number }>();
      const spendByEmail = new Map<string, { total: number; count: number }>();

      for (const order of qualifyingOrders) {
        if (order.userId) {
          const prev = spendByUserId.get(order.userId) ?? { total: 0, count: 0 };
          spendByUserId.set(order.userId, {
            total: prev.total + order.totalAmount,
            count: prev.count + 1,
          });
        } else if (order.customerEmail) {
          const key = order.customerEmail.toLowerCase();
          const prev = spendByEmail.get(key) ?? { total: 0, count: 0 };
          spendByEmail.set(key, {
            total: prev.total + order.totalAmount,
            count: prev.count + 1,
          });
        }
      }

      const enriched = users.map((u) => {
        const byId = spendByUserId.get(u.id) ?? { total: 0, count: 0 };
        const byEmail = spendByEmail.get(u.email.toLowerCase()) ?? { total: 0, count: 0 };
        const totalSpent = byId.total + byEmail.total;
        const paidOrdersCount = byId.count + byEmail.count;
        const reachedBySpend =
          config.autoUpgradeEnabled &&
          (config.vipThreshold === 0 ? true : totalSpent >= config.vipThreshold);
        const computedTier = reachedBySpend ? 'Collector' : 'Member';
        const effectiveTier = u.memberTier === 'Collector' ? 'Collector' : computedTier;

        return {
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone || '-',
          memberTier: effectiveTier,
          tierLabel: effectiveTier === 'Collector' ? config.vipTierLabel : config.memberTierLabel,
          memberStatus: u.memberStatus === MemberStatus.NONE ? MemberStatus.ACTIVE : u.memberStatus,
          memberSince: u.memberSince || u.createdAt,
          createdAt: u.createdAt,
          totalSpent,
          paidOrdersCount,
          progressPercent:
            config.vipThreshold <= 0
              ? 100
              : Math.min(100, Math.round((totalSpent / config.vipThreshold) * 100)),
        };
      });

      const filtered =
        tier && (tier === 'Member' || tier === 'Collector')
          ? enriched.filter((m) => m.memberTier === tier)
          : enriched;

      return {
        success: true,
        data: filtered,
        threshold: config.vipThreshold,
        config,
      };
    } catch (e: any) {
      set.status = 500;
      return { success: false, message: e.message };
    }
  })

  // Admin manual tier adjustment (e.g. complimentary Collector VIP upgrade)
  .patch(
    '/:id/tier',
    async ({ params: { id }, body, set }) => {
      try {
        const existing = await prisma.user.findUnique({
          where: { id },
          select: { id: true, role: true, memberSince: true },
        });

        if (!existing) {
          set.status = 404;
          return { success: false, message: 'Pengguna tidak ditemukan.' };
        }

        const isCollector = body.memberTier === 'Collector';
        const updated = await prisma.user.update({
          where: { id },
          data: {
            memberTier: body.memberTier,
            memberStatus: MemberStatus.ACTIVE,
            memberSince: existing.memberSince ?? new Date(),
            role:
              existing.role === UserRole.ADMIN
                ? UserRole.ADMIN
                : isCollector
                  ? UserRole.MEMBER
                  : UserRole.CUSTOMER,
          },
          select: {
            id: true,
            name: true,
            email: true,
            memberTier: true,
            memberStatus: true,
            memberSince: true,
          },
        });

        return {
          success: true,
          message: `Tier member berhasil diperbarui ke ${body.memberTier}.`,
          data: updated,
        };
      } catch (e: any) {
        set.status = 400;
        return { success: false, message: e.message };
      }
    },
    {
      body: t.Object({
        memberTier: t.Union([t.Literal('Member'), t.Literal('Collector')]),
      }),
    }
  );
