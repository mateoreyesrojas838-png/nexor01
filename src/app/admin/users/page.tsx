'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Search,
  Users,
  Crown,
  Shield,
  ShieldOff,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash2,
  AlertTriangle,
  X,
  ExternalLink,
  RefreshCw,
  Eye,
  Download,
} from 'lucide-react'

interface UserRow {
  id: string
  username: string
  fullName: string
  email: string
  country: string
  plan: string
  isActive: boolean
  isAdmin: boolean
  extraBots: number
  createdAt: string
  totalCommissions: number
  _count: { referrals: number }
}

const PLAN_BADGE: Record<string, string> = {
  NONE: 'text-white/30 bg-white/5 border-white/10',
  BASIC: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
  PRO: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
  ELITE: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/25',
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [updating, setUpdating] = useState<string | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ id: string; username: string; fullName: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (search) params.set('q', search)
    const res = await fetch(`/api/admin/users?${params}`)
    if (!res.ok) {
      setLoading(false)
      return
    }
    const data = await res.json()
    setUsers(data.users ?? [])
    setTotalPages(data.pages ?? 1)
    setTotal(data.total ?? 0)
    setLoading(false)
  }, [page, search])

  useEffect(() => {
    const t = setTimeout(fetchUsers, 300)
    return () => clearTimeout(t)
  }, [fetchUsers])


  async function updateUser(id: string, patch: Record<string, unknown>) {
    setUpdating(id)
    await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    await fetchUsers()
    setUpdating(null)
  }

  async function impersonate(u: UserRow) {
    if (!confirm(`Vas a ver el panel COMO "${u.username}" con acceso completo. Vas a poder operar como ese usuario. Una barra arriba te deja volver a admin.\n\n¿Continuar?`)) return
    setUpdating(u.id)
    try {
      const r = await fetch(`/api/admin/users/${u.id}/impersonate`, { method: 'POST' })
      if (!r.ok) { const d = await r.json().catch(() => ({})); alert(d.error || 'No se pudo iniciar'); setUpdating(null); return }
      window.location.href = '/dashboard'
    } catch { setUpdating(null) }
  }

  async function confirmDelete() {
    if (!deleteModal) return
    setDeleting(true)
    const res = await fetch(`/api/admin/users/${deleteModal.id}`, { method: 'DELETE' })
    const data = await res.json()
    setDeleting(false)
    if (!res.ok) {
      alert(data.error ?? 'Error al eliminar el usuario')
      return
    }
    setDeleteModal(null)
    fetchUsers()
  }


  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
            <Users size={18} className="text-amber-400" /> Usuarios
          </h1>
          <p className="text-xs text-white/30 mt-0.5">{total} usuarios registrados</p>
        </div>
        <a href="/api/admin/users/export" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-black shrink-0" style={{ background: 'linear-gradient(135deg,#15803d,#22c55e)' }}>
          <Download size={15} /> Descargar Excel
        </a>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
        <input
          type="text"
          placeholder="Buscar por nombre, usuario o email..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-amber-500/50"
        />
      </div>

      {/* Table */}
      <div className="bg-white/[0.025] border border-white/8 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-amber-400" size={22} />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xs text-white/20">No se encontraron usuarios</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white/30">Usuario</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white/30">Plan</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white/30 hidden md:table-cell">Red</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white/30 hidden md:table-cell">Comisiones</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white/30">Estado</th>
                  <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white/30">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-amber-500/15 border border-amber-500/20 flex items-center justify-center text-[11px] font-black text-amber-400 shrink-0">
                          {u.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-xs font-bold truncate max-w-[120px]">{u.fullName}</p>
                            {u.isAdmin && <Crown size={10} className="text-yellow-400 shrink-0" />}
                          </div>
                          <p className="text-[10px] text-white/30 truncate max-w-[120px]">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PLAN_BADGE[u.plan] ?? PLAN_BADGE.NONE}`}>
                        {u.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-white/50">{u._count.referrals} refs</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs font-bold text-yellow-400">${u.totalCommissions.toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${u.isActive ? 'text-green-400 bg-green-500/10 border-green-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'}`}>
                        {u.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {updating === u.id ? (
                          <Loader2 size={14} className="animate-spin text-white/40" />
                        ) : (
                          <>
                            <button
                              onClick={() => impersonate(u)}
                              title="Ver como este usuario (acceso completo)"
                              className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
                            >
                              <Eye size={13} className="text-amber-400" />
                            </button>
                            <button
                              onClick={() => updateUser(u.id, { isActive: !u.isActive })}
                              title={u.isActive ? 'Desactivar' : 'Activar'}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                            >
                              {u.isActive
                                ? <UserX size={13} className="text-red-400" />
                                : <UserCheck size={13} className="text-green-400" />
                              }
                            </button>
                            <button
                              onClick={() => {
                                const msg = u.isAdmin ? `¿Quitar el rol de administrador a "${u.username}"?` : `¿Hacer administrador a "${u.username}"?`
                                if (confirm(msg)) updateUser(u.id, { isAdmin: !u.isAdmin })
                              }}
                              title={u.isAdmin ? 'Quitar admin' : 'Hacer admin'}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                            >
                              {u.isAdmin
                                ? <ShieldOff size={13} className="text-yellow-400" />
                                : <Shield size={13} className="text-white/30" />
                              }
                            </button>
                            <select
                              value={u.plan}
                              onChange={e => updateUser(u.id, { plan: e.target.value })}
                              className="text-[10px] bg-[#0d0d1a] border border-white/10 rounded-lg px-1.5 py-1 text-white outline-none cursor-pointer hover:border-white/20 [&>option]:bg-[#0d0d1a] [&>option]:text-white"
                            >
                              <option value="NONE">NONE</option>
                              <option value="BASIC">BASIC</option>
                              <option value="PRO">PRO</option>
                              <option value="ELITE">ELITE</option>
                            </select>
                            <div className="flex items-center gap-0.5" title="Bots extra otorgados por admin">
                              <button
                                onClick={() => updateUser(u.id, { extraBots: Math.max(0, (u.extraBots ?? 0) - 1) })}
                                className="w-5 h-5 rounded bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors flex items-center justify-center text-xs font-black leading-none"
                              >−</button>
                              <span className="text-[10px] font-black text-[#00FF88] min-w-[1.5rem] text-center" title={`+${u.extraBots ?? 0} bots extra`}>+{u.extraBots ?? 0}</span>
                              <button
                                onClick={() => updateUser(u.id, { extraBots: (u.extraBots ?? 0) + 1 })}
                                className="w-5 h-5 rounded bg-white/5 hover:bg-[#00FF88]/20 text-white/50 hover:text-[#00FF88] transition-colors flex items-center justify-center text-xs font-black leading-none"
                              >+</button>
                            </div>
                            {!u.isAdmin && (
                              <button
                                onClick={() => setDeleteModal({ id: u.id, username: u.username, fullName: u.fullName })}
                                title="Eliminar usuario"
                                className="p-1.5 rounded-lg bg-red-500/8 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                              >
                                <Trash2 size={13} className="text-red-400" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg bg-white/5 border border-white/10 disabled:opacity-30 hover:bg-white/10 transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs text-white/40">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg bg-white/5 border border-white/10 disabled:opacity-30 hover:bg-white/10 transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}


      {/* Delete confirmation modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => !deleting && setDeleteModal(null)} />
          <div className="relative bg-[#13131f] border border-red-500/20 rounded-2xl p-6 w-full max-w-sm z-10 shadow-2xl shadow-black/60">

            {/* Top red line */}
            <div className="absolute top-0 left-0 right-0 h-px rounded-t-2xl"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.7), transparent)' }} />

            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center mb-4">
                <AlertTriangle size={26} className="text-red-400" />
              </div>
              <h3 className="text-base font-black text-white mb-1">Eliminar usuario</h3>
              <p className="text-xs text-white/40 mb-1">
                Estás a punto de eliminar a
              </p>
              <p className="text-sm font-black text-white mb-0.5">{deleteModal.fullName}</p>
              <p className="text-xs text-white/30 mb-4">@{deleteModal.username}</p>

              <div className="w-full flex items-start gap-2 bg-red-500/8 border border-red-500/15 rounded-xl px-3 py-2.5 mb-5 text-left">
                <AlertTriangle size={12} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-red-400/80 leading-relaxed">
                  Esta acción es <strong>irreversible</strong>. Se eliminarán todos sus datos, bots, solicitudes y comisiones.
                </p>
              </div>

              <div className="flex gap-2 w-full">
                <button
                  onClick={() => setDeleteModal(null)}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white/50 hover:bg-white/10 transition-colors disabled:opacity-40"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600/80 border border-red-500/30 text-sm font-black text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {deleting
                    ? <Loader2 size={14} className="animate-spin" />
                    : <><Trash2 size={13} /> Eliminar</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
