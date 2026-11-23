import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/react/Button';
import { Badge } from '../../components/ui/react/Badge';
import { Table } from '../../components/ui/react/Table';
import { Users, CheckCircle, XCircle } from 'lucide-react';

export const MembersTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');

  const { data: membersData, isLoading } = useQuery({
    queryKey: ['admin-members', statusFilter],
    queryFn: () => api.getMembers(statusFilter || undefined),
  });

  const applications = membersData?.data || [];

  const validateMutation = useMutation({
    mutationFn: ({ id, status, memberTier }: { id: string; status: string; memberTier?: string }) =>
      api.validateMember(id, status, memberTier, 'Disetujui oleh Administrator OMOO.'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-members'] });
    },
  });

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-line bg-surface/30 p-4 sm:p-5">
        <div>
          <h3 className="font-display text-2xl text-ink font-normal">Validasi Keanggotaan Member</h3>
          <p className="text-xs text-muted mt-0.5">
            Tinjau dan setujui permohonan customer untuk bergabung ke dalam <em>Cercle Privé</em> OMOO.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex gap-2">
          {['', 'PENDING', 'ACTIVE', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 text-xs uppercase tracking-[0.08em] font-medium border transition-colors ${
                statusFilter === st
                  ? 'bg-ink text-bg border-ink'
                  : 'bg-bg text-muted border-line hover:border-ink hover:text-ink'
              }`}
            >
              {st === '' ? 'Semua' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Applications Table */}
      <Table
        headers={['Nama & Kontak', 'Alasan / Aspirasi Bergabung', 'Status', 'Tanggal Diajukan', 'Aksi']}
        isEmpty={applications.length === 0}
      >
        {applications.map((app: any) => (
          <tr key={app.id} className="hover:bg-surface/30 transition-colors">
            {/* Customer Info */}
            <td className="py-4 px-4">
              <p className="font-medium text-ink">{app.fullName}</p>
              <p className="text-[0.68rem] text-muted">{app.email}</p>
              <p className="text-[0.68rem] text-muted">{app.phone}</p>
            </td>

            {/* Reason */}
            <td className="py-4 px-4 max-w-xs">
              <p className="text-xs text-ink leading-relaxed">
                {app.reason || 'Ingin mendapatkan akses khusus ke batch formulasi terbatas.'}
              </p>
            </td>

            {/* Status */}
            <td className="py-4 px-4">
              {app.status === 'ACTIVE' ? (
                <Badge variant="member">Cercle Privé</Badge>
              ) : app.status === 'PENDING' ? (
                <Badge variant="pending">Menunggu Validasi</Badge>
              ) : (
                <Badge variant="cancelled">Ditolak</Badge>
              )}
            </td>

            {/* Date */}
            <td className="py-4 px-4 text-xs text-muted whitespace-nowrap">
              {new Date(app.createdAt).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </td>

            {/* Actions */}
            <td className="py-4 px-4 whitespace-nowrap">
              {app.status === 'PENDING' ? (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    icon={<CheckCircle className="w-3.5 h-3.5" />}
                    onClick={() =>
                      validateMutation.mutate({
                        id: app.id,
                        status: 'ACTIVE',
                        memberTier: 'Cercle Privé',
                      })
                    }
                  >
                    Setujui Member
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<XCircle className="w-3.5 h-3.5" />}
                    onClick={() =>
                      validateMutation.mutate({
                        id: app.id,
                        status: 'REJECTED',
                      })
                    }
                  >
                    Tolak
                  </Button>
                </div>
              ) : (
                <span className="text-[0.68rem] text-muted">Telah divalidasi</span>
              )}
            </td>
          </tr>
        ))}
      </Table>
    </div>
  );
};
