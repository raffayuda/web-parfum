import { MemberStatus, OrderStatus, SectionTemplate, UserRole } from '@prisma/client';
import { prisma } from '../db';

export const LOYALTY_CONFIG_SLUG = 'loyalty-config';
export const VIP_THRESHOLD = 2_500_000;

export const QUALIFYING_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.COMPLETED,
];

export type LoyaltyTier = 'Member' | 'Collector';

export interface LoyaltyBenefitConfig {
  id: string;
  label: string;
  description: string;
  vipOnly: boolean;
  enabled: boolean;
}

export interface LoyaltyConfig {
  vipThreshold: number;
  memberTierLabel: string;
  vipTierLabel: string;
  autoUpgradeEnabled: boolean;
  qualifyingStatuses: OrderStatus[];
  benefits: LoyaltyBenefitConfig[];
}

export const DEFAULT_LOYALTY_CONFIG: LoyaltyConfig = {
  vipThreshold: VIP_THRESHOLD,
  memberTierLabel: 'Member',
  vipTierLabel: 'Collector VIP',
  autoUpgradeEnabled: true,
  qualifyingStatuses: [OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.COMPLETED],
  benefits: [
    {
      id: 'account-history',
      label: 'Riwayat & Lacak Pesanan',
      description: 'Pantau status produksi, nomor resi, dan invoice transaksi kapan saja.',
      vipOnly: false,
      enabled: true,
    },
    {
      id: 'saved-profile',
      label: 'Checkout Lebih Cepat',
      description: 'Data penerima tersimpan otomatis untuk pemesanan berikutnya.',
      vipOnly: false,
      enabled: true,
    },
    {
      id: 'free-shipping',
      label: 'Gratis Ongkos Kirim',
      description: 'Bebas biaya pengiriman reguler ke seluruh Indonesia untuk setiap pesanan.',
      vipOnly: true,
      enabled: true,
    },
    {
      id: 'complimentary-sample',
      label: 'Gratis Sampel Vial 2 ml',
      description: 'Tambahan vial eksplorasi pilihan peracik di setiap pengiriman botol 50 ml.',
      vipOnly: true,
      enabled: true,
    },
    {
      id: 'early-batch',
      label: 'Akses Awal Batch Terbatas',
      description: 'Prioritas reservasi saat batch terbaru dan edisi musiman dirilis.',
      vipOnly: true,
      enabled: true,
    },
  ],
};

export interface LoyaltyBenefit {
  id: string;
  label: string;
  description: string;
  vipOnly: boolean;
  unlocked: boolean;
}

export interface LoyaltySummary {
  tier: LoyaltyTier;
  tierLabel: string;
  memberTierLabel: string;
  vipTierLabel: string;
  isVip: boolean;
  autoUpgradeEnabled: boolean;
  totalSpent: number;
  paidOrdersCount: number;
  threshold: number;
  remainingForVip: number;
  progressPercent: number;
  benefits: LoyaltyBenefit[];
}

export function normalizeLoyaltyConfig(raw: any): LoyaltyConfig {
  if (!raw || typeof raw !== 'object') return DEFAULT_LOYALTY_CONFIG;

  const thresholdNum = Number(raw.vipThreshold);
  const validStatuses = new Set<string>([
    OrderStatus.PROCESSING,
    OrderStatus.SHIPPED,
    OrderStatus.COMPLETED,
  ]);
  const statuses = Array.isArray(raw.qualifyingStatuses)
    ? (raw.qualifyingStatuses.filter((s: any) => validStatuses.has(String(s))) as OrderStatus[])
    : DEFAULT_LOYALTY_CONFIG.qualifyingStatuses;

  const benefits = Array.isArray(raw.benefits) && raw.benefits.length > 0
    ? raw.benefits.map((b: any, idx: number) => ({
        id: String(b.id || `benefit-${idx + 1}`),
        label: String(b.label || '').trim() || 'Benefit Member',
        description: String(b.description || '').trim(),
        vipOnly: Boolean(b.vipOnly),
        enabled: b.enabled !== false,
      }))
    : DEFAULT_LOYALTY_CONFIG.benefits;

  return {
    vipThreshold: Number.isFinite(thresholdNum) && thresholdNum >= 0 ? thresholdNum : VIP_THRESHOLD,
    memberTierLabel: String(raw.memberTierLabel || '').trim() || 'Member',
    vipTierLabel: String(raw.vipTierLabel || '').trim() || 'Collector VIP',
    autoUpgradeEnabled: raw.autoUpgradeEnabled !== false,
    qualifyingStatuses: statuses.length > 0 ? statuses : DEFAULT_LOYALTY_CONFIG.qualifyingStatuses,
    benefits,
  };
}

export async function getLoyaltyConfig(): Promise<LoyaltyConfig> {
  try {
    const page = await prisma.page.findUnique({
      where: { slug: LOYALTY_CONFIG_SLUG },
      include: { sections: true },
    });
    const content = page?.sections?.[0]?.contentData as any;
    if (!content) return DEFAULT_LOYALTY_CONFIG;
    return normalizeLoyaltyConfig(content);
  } catch {
    return DEFAULT_LOYALTY_CONFIG;
  }
}

export async function saveLoyaltyConfig(raw: any): Promise<LoyaltyConfig> {
  const normalized = normalizeLoyaltyConfig(raw);
  const page = await prisma.page.findUnique({
    where: { slug: LOYALTY_CONFIG_SLUG },
    include: { sections: true },
  });

  if (!page) {
    await prisma.page.create({
      data: {
        slug: LOYALTY_CONFIG_SLUG,
        title: 'Pengaturan Aturan Loyalty & VIP',
        description: 'Konfigurasi batas minimum belanja, label tier, dan benefit Collector VIP.',
        isActive: true,
        sections: {
          create: {
            name: 'Loyalty Rules Config',
            template: SectionTemplate.RICH_TEXT_MEDIA,
            order: 0,
            contentData: normalized as any,
            isActive: true,
          },
        },
      },
    });
    return normalized;
  }

  if (page.sections.length === 0) {
    await prisma.pageSection.create({
      data: {
        pageId: page.id,
        name: 'Loyalty Rules Config',
        template: SectionTemplate.RICH_TEXT_MEDIA,
        order: 0,
        contentData: normalized as any,
        isActive: true,
      },
    });
    return normalized;
  }

  await prisma.pageSection.update({
    where: { id: page.sections[0].id },
    data: {
      contentData: normalized as any,
    },
  });

  return normalized;
}

export function buildLoyaltySummary(
  totalSpent: number,
  paidOrdersCount: number,
  overrideTier?: string | null,
  config: LoyaltyConfig = DEFAULT_LOYALTY_CONFIG
): LoyaltySummary {
  const threshold = config.vipThreshold;
  const reachedBySpend =
    config.autoUpgradeEnabled && (threshold === 0 ? true : totalSpent >= threshold);
  const isVip = reachedBySpend || overrideTier === 'Collector';
  const tier: LoyaltyTier = isVip ? 'Collector' : 'Member';
  const remainingForVip = Math.max(0, threshold - totalSpent);
  const progressPercent =
    threshold <= 0
      ? 100
      : Math.min(100, Math.round((totalSpent / threshold) * 100));

  const benefits: LoyaltyBenefit[] = config.benefits
    .filter((b) => b.enabled)
    .map((b) => ({
      id: b.id,
      label: b.label,
      description: b.description,
      vipOnly: b.vipOnly,
      unlocked: b.vipOnly ? isVip : true,
    }));

  return {
    tier,
    tierLabel: isVip ? config.vipTierLabel : config.memberTierLabel,
    memberTierLabel: config.memberTierLabel,
    vipTierLabel: config.vipTierLabel,
    isVip,
    autoUpgradeEnabled: config.autoUpgradeEnabled,
    totalSpent,
    paidOrdersCount,
    threshold,
    remainingForVip,
    progressPercent,
    benefits,
  };
}

export async function calculateUserSpend(
  userId: string,
  email?: string | null,
  statuses: OrderStatus[] = QUALIFYING_ORDER_STATUSES
) {
  const orConditions: Array<{ userId?: string; customerEmail?: string }> = [{ userId }];
  if (email) {
    orConditions.push({ customerEmail: email });
  }

  const aggregate = await prisma.order.aggregate({
    where: {
      status: { in: statuses },
      OR: orConditions,
    },
    _sum: {
      totalAmount: true,
    },
    _count: {
      _all: true,
    },
  });

  return {
    totalSpent: aggregate._sum.totalAmount ?? 0,
    paidOrdersCount: aggregate._count._all ?? 0,
  };
}

export async function syncUserLoyalty(userId: string): Promise<LoyaltySummary | null> {
  const [user, config] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        memberStatus: true,
        memberTier: true,
        memberSince: true,
      },
    }),
    getLoyaltyConfig(),
  ]);

  if (!user) return null;

  const { totalSpent, paidOrdersCount } = await calculateUserSpend(
    user.id,
    user.email,
    config.qualifyingStatuses
  );
  const summary = buildLoyaltySummary(totalSpent, paidOrdersCount, user.memberTier, config);

  const nextRole =
    user.role === UserRole.ADMIN
      ? UserRole.ADMIN
      : summary.isVip
        ? UserRole.MEMBER
        : UserRole.CUSTOMER;

  const needsUpdate =
    user.memberStatus !== MemberStatus.ACTIVE ||
    user.memberTier !== summary.tier ||
    user.role !== nextRole ||
    !user.memberSince;

  if (needsUpdate) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        memberStatus: MemberStatus.ACTIVE,
        memberTier: summary.tier,
        role: nextRole,
        memberSince: user.memberSince ?? new Date(),
      },
    });
  }

  return summary;
}

export async function syncLoyaltyForOrder(order: { userId?: string | null; customerEmail?: string | null }) {
  if (order.userId) {
    await syncUserLoyalty(order.userId);
    return;
  }

  if (order.customerEmail) {
    const user = await prisma.user.findUnique({
      where: { email: order.customerEmail },
      select: { id: true },
    });
    if (user) {
      await syncUserLoyalty(user.id);
    }
  }
}
