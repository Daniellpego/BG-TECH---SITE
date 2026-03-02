'use client';

import { useEffect, useState } from 'react';
import { Activity, Building2, Mail, Plus, Search, Users } from 'lucide-react';
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

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
          <button className="flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 font-semibold text-white transition hover:bg-sky-600">
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
    </section>
  );
}
