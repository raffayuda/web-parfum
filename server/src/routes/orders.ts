import { Elysia, t } from 'elysia';
import { prisma } from '../db';
import { OrderStatus, PaymentMethod, UserRole } from '@prisma/client';
import { generateQrisPayload, generateQrCodeDataUrl } from '../utils/qrcode';
import { hashPassword } from 'better-auth/crypto';
import { syncLoyaltyForOrder } from '../utils/loyalty';

export const ordersRoute = new Elysia({ prefix: '/orders' })
  // List all orders (Admin)
  .get('/', async ({ query }) => {
    const { status, search } = query as { status?: OrderStatus; search?: string };
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        user: { select: { id: true, name: true, email: true, memberStatus: true, memberTier: true } },
      },
    });

    return { success: true, data: orders, count: orders.length };
  })

  // Track order by orderNumber (Customer / Public Tracker)
  .get('/track/:orderNumber', async ({ params: { orderNumber }, set }) => {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: true,
      },
    });

    if (!order) {
      set.status = 404;
      return { success: false, message: `Pesanan dengan nomor '${orderNumber}' tidak ditemukan.` };
    }

    return { success: true, data: order };
  })

  // Customer's order list (by userId or customerEmail or customerPhone)
  .get('/my-orders/:identifier', async ({ params: { identifier }, query, set }) => {
    try {
      const decodedId = decodeURIComponent(identifier).trim();
      const emailQuery = (query as any)?.email ? decodeURIComponent((query as any).email).trim() : null;

      // Find user if identifier is a userId
      const emailsToMatch: string[] = [];
      const phonesToMatch: string[] = [];

      if (decodedId.includes('@')) {
        emailsToMatch.push(decodedId);
      }
      if (emailQuery && emailQuery.includes('@')) {
        emailsToMatch.push(emailQuery);
      }

      // If not an email or to get full user profile, lookup user in DB
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { id: decodedId },
            { email: { equals: decodedId, mode: 'insensitive' as const } },
            ...(emailQuery ? [{ email: { equals: emailQuery, mode: 'insensitive' as const } }] : []),
          ],
        },
      });

      if (user) {
        if (user.email && !emailsToMatch.includes(user.email)) {
          emailsToMatch.push(user.email);
        }
        if (user.phone) {
          phonesToMatch.push(user.phone.replace(/[^0-9]/g, ''));
        }
      }

      const orConditions: any[] = [
        { userId: decodedId },
      ];

      if (user?.id && user.id !== decodedId) {
        orConditions.push({ userId: user.id });
      }

      emailsToMatch.forEach((em) => {
        orConditions.push({ customerEmail: { equals: em, mode: 'insensitive' } });
      });

      phonesToMatch.forEach((ph) => {
        if (ph.length >= 8) {
          orConditions.push({ customerPhone: { contains: ph } });
        }
      });

      const orders = await prisma.order.findMany({
        where: {
          OR: orConditions,
        },
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
        },
      });

      return { success: true, data: orders, count: orders.length };
    } catch (e: any) {
      set.status = 500;
      return { success: false, message: e.message };
    }
  })

  // Get single order by ID
  .get('/:id', async ({ params: { id }, set }) => {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        user: true,
      },
    });

    if (!order) {
      set.status = 404;
      return { success: false, message: 'Pesanan tidak ditemukan.' };
    }

    return { success: true, data: order };
  })

  // Customer creates order with QRIS
  .post('/', async ({ body, set }) => {
    try {
      const data = body as any;
      const orderCount = await prisma.order.count();
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const orderNumber = `OM-${dateStr}-${(orderCount + 1).toString().padStart(4, '0')}`;

      // Calculate total
      let calculatedTotal = 0;
      const itemsData = (data.items || []).map((item: any) => {
        const subtotal = Number(item.unitPrice) * Number(item.quantity || 1);
        calculatedTotal += subtotal;
        return {
          name: item.name || item.productName || 'Flacon Wewangian OMOO',
          volume: item.volume || '50 ml',
          quantity: Number(item.quantity || 1),
          unitPrice: Number(item.unitPrice),
          subtotal,
          fragranceId: item.fragranceId || null,
        };
      });

      const shippingCost = Math.max(0, Number(data.shippingCost || 0));
      const totalAmount =
        data.totalAmount !== undefined
          ? Number(data.totalAmount)
          : calculatedTotal + shippingCost;

      // Generate QRIS payload & QR code Data URL
      const qrisPayload = generateQrisPayload({
        merchantName: process.env.QRIS_MERCHANT_NAME || 'OMOO STUDIO',
        orderNumber,
        amount: totalAmount,
      });
      const qrisQrCodeUrl = await generateQrCodeDataUrl(qrisPayload);

      // Auto-resolve userId if not provided
      let finalUserId = data.userId || null;
      if (!finalUserId && data.customerEmail) {
        const matchedUser = await prisma.user.findFirst({
          where: { email: { equals: data.customerEmail, mode: 'insensitive' as const } },
        });
        if (matchedUser) {
          finalUserId = matchedUser.id;
        }
      }

      const order = await prisma.order.create({
        data: {
          orderNumber,
          userId: finalUserId,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          shippingAddress: data.shippingAddress || 'Alamat tidak diisi',
          shippingCity: data.shippingCity || data.city || 'Jakarta Selatan',
          shippingPostal: data.shippingPostal || data.postalCode || '12190',
          shippingCourier: data.shippingCourier || 'JNE REG',
          totalAmount,
          paymentMethod: PaymentMethod.QRIS,
          status: OrderStatus.PENDING_PAYMENT,
          qrisPayload,
          items: {
            create: itemsData,
          },
        },
        include: {
          items: true,
        },
      });

      // Prepare WhatsApp direct confirmation message URL using admin site-settings first
      let adminWa = process.env.WHATSAPP_ADMIN_NUMBER || '6281200000000';
      try {
        const settingsPage = await prisma.page.findUnique({
          where: { slug: 'site-settings' },
          include: { sections: true },
        });
        const configuredWa = (settingsPage?.sections?.[0]?.contentData as any)?.whatsappNumber;
        if (configuredWa) {
          const digits = String(configuredWa).replace(/\D/g, '');
          if (digits) {
            adminWa = digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
          }
        }
      } catch {}

      const itemsSummary = order.items
        .map((it) => `- ${it.quantity}x ${it.name} (${it.volume})`)
        .join('\n');
      const waText = `Halo Admin OMOO, saya sudah melakukan pemesanan dan mengunggah bukti pembayaran QRIS:\n\n*Nomor Pesanan:* ${orderNumber}\n*Nama:* ${order.customerName}\n*Item:*\n${itemsSummary}\n*Total:* Rp ${order.totalAmount.toLocaleString('id-ID')}\n\nMohon bantu verifikasi pembayaran saya. Terima kasih.`;
      const waConfirmationUrl = `https://wa.me/${adminWa}?text=${encodeURIComponent(waText)}`;

      return {
        success: true,
        message: 'Pesanan berhasil dibuat. Silakan lakukan pembayaran via QRIS.',
        data: {
          ...order,
          qrisQrCodeUrl,
          waConfirmationUrl,
        },
      };
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  })

  // Customer uploads transfer proof receipt
  .post('/:id/upload-receipt', async ({ params: { id }, body, set }) => {
    try {
      const { paymentProofUrl, paymentProofNote } = body as {
        paymentProofUrl: string;
        paymentProofNote?: string;
      };

      const updated = await prisma.order.update({
        where: { id },
        data: {
          paymentProofUrl,
          paymentProofNote,
          status: OrderStatus.AWAITING_VALIDATION,
        },
      });

      return {
        success: true,
        message: 'Bukti transfer berhasil diunggah. Menunggu verifikasi concierge kami.',
        data: updated,
      };
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  })

  // Admin validates payment receipt
  .patch('/:id/validate', async ({ params: { id }, body, set }) => {
    try {
      const { validatedBy, adminNotes } = (body as any) || {};

      const updated = await prisma.order.update({
        where: { id },
        data: {
          status: OrderStatus.PROCESSING,
          validatedAt: new Date(),
          validatedBy: validatedBy || 'Admin OMOO',
          adminNotes: adminNotes || 'Pembayaran transfer QRIS telah diverifikasi valid.',
        },
      });

      await syncLoyaltyForOrder(updated).catch(() => {});

      return {
        success: true,
        message: 'Pembayaran berhasil divalidasi. Status pesanan diperbarui menjadi PROCESSING.',
        data: updated,
      };
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  })

  // Admin updates order shipping or completion status
  .patch('/:id/status', async ({ params: { id }, body, set }) => {
    try {
      const { status, trackingNumber, shippingCourier, adminNotes } = body as {
        status: OrderStatus;
        trackingNumber?: string;
        shippingCourier?: string;
        adminNotes?: string;
      };

      const dataToUpdate: any = { status };
      if (trackingNumber !== undefined) dataToUpdate.trackingNumber = trackingNumber;
      if (shippingCourier !== undefined) dataToUpdate.shippingCourier = shippingCourier;
      if (adminNotes !== undefined) dataToUpdate.adminNotes = adminNotes;

      const updated = await prisma.order.update({
        where: { id },
        data: dataToUpdate,
      });

      await syncLoyaltyForOrder(updated).catch(() => {});

      return {
        success: true,
        message: `Status pesanan berhasil diubah menjadi ${status}`,
        data: updated,
      };
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  })

  // Admin creates customer account & places order on their behalf (WhatsApp buyer flow)
  .post('/manual', async ({ body, set }) => {
    try {
      const data = body as any;
      const {
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        shippingCity,
        shippingPostal,
        items,
        paymentStatus = 'PROCESSING', // Usually already paid via WA
        adminNotes,
        createdByAdminId,
      } = data;

      // 1. Check or create customer account
      let customerUser = await prisma.user.findUnique({
        where: { email: customerEmail },
      });

      let temporaryPassword = '';
      let isNewAccount = false;

      if (!customerUser) {
        // Generate friendly temporary password
        temporaryPassword = `omoo${Math.floor(1000 + Math.random() * 9000)}`;
        const hashedPassword = await hashPassword(temporaryPassword);

        customerUser = await prisma.user.create({
          data: {
            name: customerName,
            email: customerEmail,
            phone: customerPhone,
            role: UserRole.CUSTOMER,
            emailVerified: true,
          },
        });

        await prisma.account.create({
          data: {
            userId: customerUser.id,
            accountId: customerUser.id,
            providerId: 'credential',
            password: hashedPassword,
          },
        });

        isNewAccount = true;
      }

      // 2. Generate unique order number
      const orderCount = await prisma.order.count();
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const orderNumber = `OM-${dateStr}-${(orderCount + 1).toString().padStart(4, '0')}`;

      // 3. Calculate items and total
      let totalAmount = 0;
      const orderItems = (items || []).map((item: any) => {
        const subtotal = Number(item.unitPrice) * Number(item.quantity || 1);
        totalAmount += subtotal;
        return {
          name: item.name,
          volume: item.volume || '50 ml',
          quantity: Number(item.quantity || 1),
          unitPrice: Number(item.unitPrice),
          subtotal,
          fragranceId: item.fragranceId || null,
        };
      });

      // 4. Create the order
      const order = await prisma.order.create({
        data: {
          orderNumber,
          userId: customerUser.id,
          createdByAdminId: createdByAdminId || null,
          customerName,
          customerEmail,
          customerPhone,
          shippingAddress: shippingAddress || 'Alamat dikonfirmasi via WhatsApp',
          shippingCity: shippingCity || 'Jakarta',
          shippingPostal: shippingPostal || '12000',
          shippingCourier: data.shippingCourier || 'JNE YES',
          trackingNumber: data.trackingNumber || null,
          totalAmount,
          paymentMethod: PaymentMethod.WHATSAPP_MANUAL,
          status: paymentStatus as OrderStatus,
          validatedAt: new Date(),
          validatedBy: 'Admin OMOO (Manual WA)',
          adminNotes: adminNotes || 'Pesanan dibuat manual oleh admin dari interaksi WhatsApp.',
          items: {
            create: orderItems,
          },
        },
        include: {
          items: true,
        },
      });

      await syncLoyaltyForOrder(order).catch(() => {});

      // 5. Build pre-crafted WhatsApp message to send back to customer
      const trackingUrl = `${process.env.PUBLIC_SITE_URL || 'http://localhost:4321'}/account/tracker?order=${orderNumber}`;
      const waGreeting = `Halo Kak ${customerName},\n\nTerima kasih atas pemesanan wewangian OMOO melalui WhatsApp!\n\nPesanan Anda telah kami input ke sistem dengan nomor *${orderNumber}* (Total: Rp ${totalAmount.toLocaleString('id-ID')}).\n\nUntuk memantau proses pengemasan dan pengiriman secara real-time, Anda dapat membuka tracker resmi kami:\n${trackingUrl}\n` +
        (isNewAccount
          ? `\nKami juga telah membuatkan akun member Anda:\nEmail: *${customerEmail}*\nPassword Sementara: *${temporaryPassword}*\n`
          : `\nSilakan masuk dengan akun yang sudah terdaftar.`);

      return {
        success: true,
        message: 'Akun customer dan pesanan berhasil dibuat oleh admin.',
        data: {
          order,
          customer: {
            id: customerUser.id,
            name: customerUser.name,
            email: customerUser.email,
            isNewAccount,
            temporaryPassword: isNewAccount ? temporaryPassword : null,
          },
          trackingUrl,
          customerNotificationText: waGreeting,
        },
      };
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  })

  // Admin updates full order details (Edit Pesanan)
  .patch('/:id', async ({ params: { id }, body, set }) => {
    try {
      const {
        customerName,
        customerEmail,
        customerPhone,
        shippingAddress,
        shippingCity,
        shippingPostal,
        shippingCourier,
        trackingNumber,
        status,
        totalAmount,
        adminNotes,
      } = body as any;

      const dataToUpdate: any = {};
      if (customerName !== undefined) dataToUpdate.customerName = customerName;
      if (customerEmail !== undefined) dataToUpdate.customerEmail = customerEmail;
      if (customerPhone !== undefined) dataToUpdate.customerPhone = customerPhone;
      if (shippingAddress !== undefined) dataToUpdate.shippingAddress = shippingAddress;
      if (shippingCity !== undefined) dataToUpdate.shippingCity = shippingCity;
      if (shippingPostal !== undefined) dataToUpdate.shippingPostal = shippingPostal;
      if (shippingCourier !== undefined) dataToUpdate.shippingCourier = shippingCourier;
      if (trackingNumber !== undefined) dataToUpdate.trackingNumber = trackingNumber;
      if (status !== undefined) dataToUpdate.status = status as OrderStatus;
      if (totalAmount !== undefined) dataToUpdate.totalAmount = Number(totalAmount);
      if (adminNotes !== undefined) dataToUpdate.adminNotes = adminNotes;

      const updated = await prisma.order.update({
        where: { id },
        data: dataToUpdate,
        include: { items: true },
      });

      await syncLoyaltyForOrder(updated).catch(() => {});

      return {
        success: true,
        message: 'Pesanan berhasil diperbarui.',
        data: updated,
      };
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  })

  // Admin deletes an order
  .delete('/:id', async ({ params: { id }, set }) => {
    try {
      const existing = await prisma.order.findUnique({
        where: { id },
        select: { userId: true, customerEmail: true },
      });

      // Delete order items first
      await prisma.orderItem.deleteMany({ where: { orderId: id } });
      await prisma.order.delete({ where: { id } });

      if (existing) {
        await syncLoyaltyForOrder(existing).catch(() => {});
      }

      return {
        success: true,
        message: 'Pesanan berhasil dihapus.',
      };
    } catch (e: any) {
      set.status = 400;
      return { success: false, message: e.message };
    }
  });
