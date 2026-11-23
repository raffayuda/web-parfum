import { Elysia } from 'elysia';
import { prisma } from '../db';
import { UserRole, MemberStatus } from '@prisma/client';
import { hashPassword } from 'better-auth/crypto';

export const usersRoute = new Elysia({ prefix: '/users' })
  // List all users / customers (Admin)
  .get('/', async ({ query }) => {
    const { search } = query as { search?: string };
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
        { phone: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
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
        orders: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            status: true,
            paymentMethod: true,
            trackingNumber: true,
            shippingCourier: true,
            createdAt: true,
            items: true,
          },
        },
      },
    });

    const enrichedUsers = users.map((u) => {
      const totalSpent = u.orders
        .filter((o) => o.status !== 'CANCELLED')
        .reduce((sum, o) => sum + o.totalAmount, 0);

      return {
        ...u,
        totalOrders: u.orders.length,
        totalSpent,
      };
    });

    return { success: true, data: enrichedUsers, count: enrichedUsers.length };
  })

  // Get single user detail with full order history
  .get('/:id', async ({ params: { id }, set }) => {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          include: {
            items: true,
          },
        },
        memberApps: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      set.status = 404;
      return { success: false, message: 'User tidak ditemukan' };
    }

    const totalSpent = user.orders
      .filter((o) => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    return {
      success: true,
      data: {
        ...user,
        totalOrders: user.orders.length,
        totalSpent,
      },
    };
  })

  // Create new user (Admin)
  .post('/', async ({ body, set }) => {
    try {
      const { name, email, phone, role = 'CUSTOMER', memberStatus = 'NONE', memberTier, password } = body as any;

      if (!name || !email) {
        set.status = 400;
        return { success: false, message: 'Nama dan email wajib diisi.' };
      }

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        set.status = 400;
        return { success: false, message: 'Email sudah terdaftar.' };
      }

      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          phone: phone || null,
          role: (role as UserRole) || UserRole.CUSTOMER,
          memberStatus: (memberStatus as MemberStatus) || MemberStatus.NONE,
          memberTier: memberTier || null,
          memberSince: memberStatus === 'ACTIVE' ? new Date() : null,
          emailVerified: true,
        },
      });

      // If password provided, create credential account
      if (password) {
        const hashedPassword = await hashPassword(password);
        await prisma.account.create({
          data: {
            userId: newUser.id,
            accountId: newUser.id,
            providerId: 'credential',
            password: hashedPassword,
          },
        });
      }

      return {
        success: true,
        message: 'Pengguna baru berhasil ditambahkan.',
        data: newUser,
      };
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  })

  // Update existing user (Admin)
  .put('/:id', async ({ params: { id }, body, set }) => {
    try {
      const { name, email, phone, role, memberStatus, memberTier, password } = body as any;

      const dataToUpdate: any = {};
      if (name !== undefined) dataToUpdate.name = name;
      if (email !== undefined) dataToUpdate.email = email;
      if (phone !== undefined) dataToUpdate.phone = phone;
      if (role !== undefined) dataToUpdate.role = role as UserRole;
      if (memberStatus !== undefined) {
        dataToUpdate.memberStatus = memberStatus as MemberStatus;
        if (memberStatus === 'ACTIVE') dataToUpdate.memberSince = new Date();
      }
      if (memberTier !== undefined) dataToUpdate.memberTier = memberTier;

      const updated = await prisma.user.update({
        where: { id },
        data: dataToUpdate,
      });

      if (password) {
        const hashedPassword = await hashPassword(password);
        const acc = await prisma.account.findFirst({
          where: { userId: id, providerId: 'credential' },
        });
        if (acc) {
          await prisma.account.update({
            where: { id: acc.id },
            data: { password: hashedPassword },
          });
        } else {
          await prisma.account.create({
            data: {
              userId: id,
              accountId: id,
              providerId: 'credential',
              password: hashedPassword,
            },
          });
        }
      }

      return {
        success: true,
        message: 'Data pengguna berhasil diperbarui.',
        data: updated,
      };
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  })

  // Delete user (Admin)
  .delete('/:id', async ({ params: { id }, set }) => {
    try {
      // Clean up relations first
      await prisma.session.deleteMany({ where: { userId: id } });
      await prisma.account.deleteMany({ where: { userId: id } });
      await prisma.memberApplication.deleteMany({ where: { userId: id } });
      // Detach orders instead of deleting them to preserve audit trails
      await prisma.order.updateMany({
        where: { userId: id },
        data: { userId: null },
      });

      await prisma.user.delete({ where: { id } });

      return {
        success: true,
        message: 'Pengguna berhasil dihapus.',
      };
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  });
