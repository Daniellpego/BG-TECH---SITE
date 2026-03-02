'use client';

import { useEffect, useState } from 'react';
import { Activity, Building2, Mail, Plus, Search, Users, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Contact = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role?: string;
};

type Account = {
  id: string;
  company_name: string;
  industry?: string;
  status: 'Active Client' | 'Prospect' | 'Churned' | string;
  created_at: string;
  crm_contacts: Contact[];
};

type FormData = {
  company_name: string;
  industry: string;
  status: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_email: string;
  contact_role: string;
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    company_name: '',
    industry: '',
    status: 'Prospect',
    contact_first_name: '',
    contact_last_name: '',
    contact_email: '',
    contact_role: '',
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  async function fetchAccounts() {
    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('crm_accounts')
        .select(
          'id, company_name, industry, status, created_at, crm_contacts(id, first_name, last_name, email, role)'
        );

      if (supabaseError) throw supabaseError;

      setAccounts((data as Account[]) || []);
    } catch (err: any) {
      console.error('Erro ao buscar contas:', err);
      setError(err.message || 'Erro ao carregar contas');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.company_name.trim()) {
      alert('Nome da empresa é obrigatório');
      return;
    }

    try {
      setSubmitting(true);

      // 1. Insert na tabela crm_accounts
      const { data: accountData, error: accountError } = await supabase
        .from('crm_accounts')
        .insert([
          {
            company_name: formData.company_name.trim(),
            industry: formData.industry.trim() || null,
            status: formData.status,
          },
        ])
        .select();

      if (accountError) throw accountError;

      const newAccountId = accountData[0]?.id;

      // 2. Se houver contato principal, inseri-lo na tabela crm_contacts
      if (formData.contact_first_name.trim() && formData.contact_email.trim()) {
        const { error: contactError } = await supabase
          .from('crm_contacts')
          .insert([
            {
              account_id: newAccountId,
              first_name: formData.contact_first_name.trim(),
              last_name: formData.contact_last_name.trim() || '',
              email: formData.contact_email.trim(),
              role: formData.contact_role.trim() || null,
            },
          ]);

        if (contactError) throw contactError;
      }

      // 3. Fechar modal e resetar form
      setShowModal(false);
      setFormData({
        company_name: '',
        industry: '',
        status: 'Prospect',
        contact_first_name: '',
        contact_last_name: '',
        contact_email: '',
        contact_role: '',
      });

      // 4. Recarregar contas
      await fetchAccounts();
    } catch (err: any) {
      console.error('Erro ao criar conta:', err);
      alert('Erro ao criar conta: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setSubmitting(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active client':
        return {
          badge: 'bg-emerald-500/20 text-emerald-300',
          dot: 'bg-emerald-500',
        };
      case 'prospect':
        return {
          badge: 'bg-sky-500/20 text-sky-300',
          dot: 'bg-sky-500',
        };
      case 'churned':
        return {
          badge: 'bg-rose-500/20 text-rose-300',
          dot: 'bg-rose-500',
        };
      default:
        return {
          badge: 'bg-slate-500/20 text-slate-300',
          dot: 'bg-slate-500',
        };
    }
  };

  const filteredAccounts = accounts.filter(
    (account) =>
      account.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section className="animate-in fade-in duration-500">
      {/* Cabeçalho */}
      <header className="mb-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-slate-100">
              <Building2 className="h-8 w-8 text-sky-400" />
              Contas & Contatos
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Gerencie suas empresas clientes e contatos
            </p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 font-semibold text-white transition hover:bg-sky-600"
          >
            <Plus className="h-5 w-5" />
            Nova Conta
          </button>
        </div>
      </header>

      {/* Barra de Busca */}
      <div className="mb-6 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl">
        <Search className="h-5 w-5 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por empresa ou setor..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 outline-none"
        />
      </div>

      {/* Estado de Carregamento */}
      {loading && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-12 backdrop-blur-xl">
          <Activity className="mb-4 h-8 w-8 animate-spin text-sky-400" />
          <p className="text-slate-300">Carregando contas...</p>
        </div>
      )}

      {/* Mensagem de Erro */}
      {error && !loading && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4">
          <p className="text-sm font-medium text-rose-300">Erro: {error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredAccounts.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-12 backdrop-blur-xl">
          <Building2 className="mb-4 h-12 w-12 text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-300">
            Nenhuma conta cadastrada
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Clique em "Nova Conta" para começar
          </p>
        </div>
      )}

      {/* Grid de Contas */}
      {!loading && !error && filteredAccounts.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAccounts.map((account) => {
            const colors = getStatusColor(account.status);
            return (
              <article
                key={account.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition hover:border-sky-400/30 hover:bg-white/[0.08]"
              >
                {/* Cabeçalho do Card */}
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-100">
                      {account.company_name}
                    </h3>
                    {account.industry && (
                      <p className="text-xs text-slate-400">
                        Setor: {account.industry}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-shrink-0 gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${colors.badge}`}>
                      {account.status}
                    </span>
                  </div>
                </div>

                {/* Separador */}
                <div className="mb-4 border-t border-white/10" />

                {/* Contatos */}
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4 text-sky-400" />
                    <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                      Contatos ({account.crm_contacts?.length || 0})
                    </span>
                  </div>

                  {account.crm_contacts && account.crm_contacts.length > 0 ? (
                    <ul className="space-y-2">
                      {account.crm_contacts.map((contact) => (
                        <li
                          key={contact.id}
                          className="rounded-lg bg-white/5 p-3 text-xs"
                        >
                          <p className="font-semibold text-slate-100">
                            {contact.first_name} {contact.last_name}
                          </p>
                          <div className="mt-1 flex items-center gap-1 text-slate-400">
                            <Mail className="h-3 w-3" />
                            <a
                              href={`mailto:${contact.email}`}
                              className="hover:text-sky-400"
                            >
                              {contact.email}
                            </a>
                          </div>
                          {contact.role && (
                            <p className="mt-1 text-slate-500">{contact.role}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="rounded-lg bg-white/5 p-3 text-center">
                      <p className="text-xs text-slate-500">
                        Sem contatos associados
                      </p>
                    </div>
                  )}
                </div>

                {/* Rodapé com Data */}
                <div className="mt-4 border-t border-white/10 pt-3 text-right">
                  <p className="text-xs text-slate-500">
                    Criado em{' '}
                    {new Date(account.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Modal de Nova Conta */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0a0f1a] p-8 shadow-2xl">
            {/* Cabeçalho do Modal */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-100">Nova Conta</h2>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-slate-100"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Formulário */}
            <form onSubmit={handleCreateAccount} className="space-y-6">
              {/* Seção da Empresa */}
              <div>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-400">
                  Informações da Empresa
                </h3>
                <div className="space-y-4">
                  {/* Nome da Empresa */}
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-300">
                      <Building2 className="h-4 w-4 text-sky-400" />
                      Nome da Empresa *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Tech Solutions Inc."
                      value={formData.company_name}
                      onChange={(e) =>
                        setFormData({ ...formData, company_name: e.target.value })
                      }
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-slate-100 placeholder-slate-500 outline-none transition focus:border-sky-400 focus:bg-white/10"
                      required
                    />
                  </div>

                  {/* Setor */}
                  <div>
                    <label className="mb-2 text-sm font-semibold text-slate-300">
                      Setor (Industry)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Tecnologia, Marketing, Consultoria..."
                      value={formData.industry}
                      onChange={(e) =>
                        setFormData({ ...formData, industry: e.target.value })
                      }
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-slate-100 placeholder-slate-500 outline-none transition focus:border-sky-400 focus:bg-white/10"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="mb-2 text-sm font-semibold text-slate-300">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-slate-100 outline-none transition focus:border-sky-400 focus:bg-white/10"
                    >
                      <option value="Prospect">Prospect</option>
                      <option value="Active Client">Active Client</option>
                      <option value="Churned">Churned</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Separador */}
              <div className="border-t border-white/10" />

              {/* Seção do Contato Principal */}
              <div>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-400">
                  Contato Principal (Opcional)
                </h3>
                <div className="space-y-4">
                  {/* Nome do Contato */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 text-sm font-semibold text-slate-300">
                        Primeiro Nome
                      </label>
                      <input
                        type="text"
                        placeholder="João"
                        value={formData.contact_first_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contact_first_name: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-slate-100 placeholder-slate-500 outline-none transition focus:border-sky-400 focus:bg-white/10"
                      />
                    </div>
                    <div>
                      <label className="mb-2 text-sm font-semibold text-slate-300">
                        Último Nome
                      </label>
                      <input
                        type="text"
                        placeholder="Silva"
                        value={formData.contact_last_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contact_last_name: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-slate-100 placeholder-slate-500 outline-none transition focus:border-sky-400 focus:bg-white/10"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-300">
                      <Mail className="h-4 w-4 text-sky-400" />
                      E-mail
                    </label>
                    <input
                      type="email"
                      placeholder="joao@example.com"
                      value={formData.contact_email}
                      onChange={(e) =>
                        setFormData({ ...formData, contact_email: e.target.value })
                      }
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-slate-100 placeholder-slate-500 outline-none transition focus:border-sky-400 focus:bg-white/10"
                    />
                  </div>

                  {/* Cargo */}
                  <div>
                    <label className="mb-2 text-sm font-semibold text-slate-300">
                      Cargo
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: CEO, Gerente de TI, Consultor..."
                      value={formData.contact_role}
                      onChange={(e) =>
                        setFormData({ ...formData, contact_role: e.target.value })
                      }
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-slate-100 placeholder-slate-500 outline-none transition focus:border-sky-400 focus:bg-white/10"
                    />
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-lg border border-white/10 px-4 py-2.5 font-semibold text-slate-300 transition hover:bg-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-sky-500 px-4 py-2.5 font-semibold text-white transition hover:bg-sky-600 disabled:opacity-50"
                >
                  {submitting ? 'Salvando...' : 'Salvar Conta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
