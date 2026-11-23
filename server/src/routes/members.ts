import { Elysia, t } from 'elysia';
import { prisma } from '../db';
import { MemberStatus, UserRole } from '@prisma/client';

export const membersRoute = new Elysia({ prefix: '/members' })
  // List all member applications (Admin)
  .get('/', async ({ query }) => {
    const { status } = query as { status?: MemberStatus };
    const where: any = {};
    if (status) where.status = status;

    const applications = await prisma.memberApplication.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, memberStatus: true, memberTier: true } },
      },
    });

    return { success: true, data: applications };
  })

  // Customer applies for Cercle Privé
  .post('/apply', async ({ body, set }) => {
    try {
      const data = body as any;
      let { userId, fullName, email, phone, reason } = data;

      let user = null;
      if (userId) {
        user = await prisma.user.findUnique({ where: { id: userId } });
      }
      if (!user && email) {
        user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          // Auto create customer account if applying for the first time
          user = await prisma.user.create({
            data: {
              name: fullName || 'Member Applicant',
              email,
              phone: phone || null,
              role: UserRole.CUSTOMER,
            },
          });
        }
        userId = user.id;
      }

      if (!user) {
        set.status = 400;
        return { success: false, message: 'Identitas pemohon (email atau user) diperlukan.' };
      }

      const application = await prisma.memberApplication.create({
        data: {
          userId,
          fullName: fullName || user.name,
          email: email || user.email,
          phone: phone || user.phone,
          reason,
          status: MemberStatus.PENDING,
        },
      });

      await prisma.user.update({
        where: { id: userId },
        data: { memberStatus: MemberStatus.PENDING },
      });

      return {
        success: true,
        message: 'Permohonan keanggotaan Cercle Privé berhasil diajukan.',
        data: application,
      };
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  })

  // Admin validates/approves or rejects membership
  .patch('/:id/validate', async ({ params: { id }, body, set }) => {
    try {
      const { status, memberTier = 'Cercle Privé', adminNotes } = body as {
        status: MemberStatus;
        memberTier?: string;
        adminNotes?: string;
      };

      const application = await prisma.memberApplication.update({
        where: { id },
        data: {
          status,
          adminNotes,
          reviewedAt: new Date(),
        },
      });

      if (status === MemberStatus.ACTIVE) {
        await prisma.user.update({
          where: { id: application.userId },
          data: {
            role: UserRole.MEMBER,
            memberStatus: MemberStatus.ACTIVE,
            memberTier,
            memberSince: new Date(),
          },
        });
      } else if (status === MemberStatus.REJECTED) {
        await prisma.user.update({
          where: { id: application.userId },
          data: {
            memberStatus: MemberStatus.REJECTED,
          },
        });
      }

      return {
        success: true,
        message: `Aplikasi member berhasil diubah menjadi ${status}`,
        data: application,
      };
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  });
