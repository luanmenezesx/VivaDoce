import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { COURSES } from '../utils/courses';
import { CustomerModal } from './CustomerModal';
import { 
  Users, Candy, Gift, Plus, Search, 
  ChevronRight, Sparkles, CheckCircle
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  course: string;
  created_at: string;
}

interface CustomerMapped extends Customer {
  totalPurchases: number;
  purchasesThisCycle: number;
  rewardsAvailable: number;
  rewardsRedeemed: number;
}

interface AdminDashboardProps {
  adminEmail: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ adminEmail }) => {
  const [customers, setCustomers] = useState<CustomerMapped[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Registration Form
  const [newName, setNewName] = useState('');
  const [newCourse, setNewCourse] = useState('');
  const [submittingCustomer, setSubmittingCustomer] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);

  // Selected Customer Modal
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch all customers
      const { data: customersData, error: custError } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true });

      if (custError) throw custError;

      // 2. Fetch all purchases
      const { data: purchasesData, error: purchError } = await supabase
        .from('purchases')
        .select('customer_id, quantity');

      if (purchError) throw purchError;

      // 3. Fetch all rewards
      const { data: rewardsData, error: rewError } = await supabase
        .from('rewards')
        .select('customer_id, quantity, status');

      if (rewError) throw rewError;

      // Map everything together in-memory
      const mapped: CustomerMapped[] = (customersData || []).map(cust => {
        const custPurchases = (purchasesData || [])
          .filter(p => p.customer_id === cust.id)
          .reduce((sum, p) => sum + p.quantity, 0);

        const custRewardsAvailable = (rewardsData || [])
          .filter(r => r.customer_id === cust.id && r.status === 'available')
          .reduce((sum, r) => sum + r.quantity, 0);

        const custRewardsRedeemed = (rewardsData || [])
          .filter(r => r.customer_id === cust.id && r.status === 'redeemed')
          .reduce((sum, r) => sum + r.quantity, 0);

        return {
          ...cust,
          totalPurchases: custPurchases,
          purchasesThisCycle: custPurchases % 10,
          rewardsAvailable: custRewardsAvailable,
          rewardsRedeemed: custRewardsRedeemed,
        };
      });

      setCustomers(mapped);
    } catch (err) {
      console.error('Error loading admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newCourse) return;

    setSubmittingCustomer(true);
    setRegSuccess(false);

    try {
      const { error } = await supabase.from('customers').insert({
        name: newName.trim(),
        course: newCourse,
      });

      if (error) throw error;

      setNewName('');
      setNewCourse('');
      setRegSuccess(true);
      setTimeout(() => setRegSuccess(false), 3000);
      await loadData();
    } catch (err) {
      console.error('Error creating customer:', err);
      alert('Erro ao cadastrar cliente. Tente novamente.');
    } finally {
      setSubmittingCustomer(false);
    }
  };

  // Dashboard Stats Calculations
  const stats = {
    totalCustomers: customers.length,
    totalPurchases: customers.reduce((sum, c) => sum + c.totalPurchases, 0),
    rewardsAvailable: customers.reduce((sum, c) => sum + c.rewardsAvailable, 0),
    rewardsRedeemed: customers.reduce((sum, c) => sum + c.rewardsRedeemed, 0),
  };

  // Filter out clients who are close to win (progress 8/10 or 9/10)
  const closeToWin = [...customers]
    .filter(c => c.purchasesThisCycle >= 8 && c.purchasesThisCycle < 10)
    .sort((a, b) => b.purchasesThisCycle - a.purchasesThisCycle)
    .slice(0, 5);

  // Search filter
  const filteredCustomers = customers.filter(c => {
    const term = searchTerm.toLowerCase();
    return c.name.toLowerCase().includes(term) || c.course.toLowerCase().includes(term);
  });

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-8">
      
      {/* Dashboard Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Card 1: Clients */}
        <div className="bg-cream-light border border-cream-dark p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-chocolate/10 border border-chocolate/20 text-chocolate rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-chocolate-pale tracking-wider">Clientes</p>
            <p className="text-xl font-extrabold text-chocolate leading-tight">{stats.totalCustomers}</p>
          </div>
        </div>

        {/* Card 2: Sales */}
        <div className="bg-cream-light border border-cream-dark p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-chocolate/10 border border-chocolate/20 text-chocolate rounded-xl">
            <Candy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-chocolate-pale tracking-wider">Palhas Vendidas</p>
            <p className="text-xl font-extrabold text-chocolate leading-tight">{stats.totalPurchases}</p>
          </div>
        </div>

        {/* Card 3: Rewards Available */}
        <div className="bg-cream-light border border-cream-dark p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-chocolate-pale tracking-wider">Prêmios Disp.</p>
            <p className="text-xl font-extrabold text-emerald-800 leading-tight">{stats.rewardsAvailable}</p>
          </div>
        </div>

        {/* Card 4: Rewards Redeemed */}
        <div className="bg-cream-light border border-cream-dark p-5 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-accent-gold/10 border border-accent-gold/30 text-accent-gold rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-chocolate-pale tracking-wider">Prêmios Resg.</p>
            <p className="text-xl font-extrabold text-chocolate leading-tight">{stats.rewardsRedeemed}</p>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Registration & Clientes Próximos */}
        <div className="space-y-8 lg:col-span-1">
          
          {/* Section: Cadastrar Cliente */}
          <div className="bg-cream-light border border-cream-dark rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-chocolate uppercase tracking-wider flex items-center gap-1.5 border-b border-cream-medium pb-2">
                <Plus className="w-4 h-4 text-accent-gold" />
                Cadastrar cliente
              </h3>
            </div>

            {regSuccess && (
              <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs p-3 rounded-xl flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>Cliente cadastrado com sucesso!</span>
              </div>
            )}

            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div>
                <label htmlFor="reg-name" className="block text-[10px] font-bold text-chocolate uppercase tracking-wider mb-1">
                  Nome completo
                </label>
                <input
                  id="reg-name"
                  type="text"
                  placeholder="Nome do cliente"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-cream-medium/30 border border-cream-dark rounded-xl text-chocolate placeholder-chocolate-pale/50 focus:outline-none focus:ring-2 focus:ring-chocolate/15 focus:border-chocolate transition-all text-xs"
                />
              </div>

              <div>
                <label htmlFor="reg-course" className="block text-[10px] font-bold text-chocolate uppercase tracking-wider mb-1">
                  Curso
                </label>
                <select
                  id="reg-course"
                  value={newCourse}
                  onChange={(e) => setNewCourse(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-cream-medium/30 border border-cream-dark rounded-xl text-chocolate focus:outline-none focus:ring-2 focus:ring-chocolate/15 focus:border-chocolate transition-all text-xs appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234A3728' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '14px'
                  }}
                >
                  <option value="" disabled>Selecione o curso...</option>
                  {COURSES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={submittingCustomer}
                className="w-full py-2.5 bg-chocolate hover:bg-chocolate-light text-cream-light font-bold rounded-xl active:scale-[0.98] transition-all text-xs flex items-center justify-center gap-1 cursor-pointer disabled:opacity-70"
              >
                {submittingCustomer ? 'Cadastrando...' : '+ Cadastrar cliente'}
              </button>
            </form>
          </div>

          {/* Section: Próximos de Ganhar */}
          <div className="bg-cream-light border border-cream-dark rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-chocolate uppercase tracking-wider flex items-center gap-1.5 border-b border-cream-medium pb-2">
                <Sparkles className="w-4 h-4 text-accent-gold" />
                Clientes próximos de ganhar
              </h3>
            </div>

            {closeToWin.length === 0 ? (
              <p className="text-[11px] text-chocolate-pale/75 italic text-center py-4">Nenhum cliente com 8/10 ou 9/10 no momento.</p>
            ) : (
              <div className="divide-y divide-cream-medium">
                {closeToWin.map(c => (
                  <div 
                    key={c.id} 
                    onClick={() => setSelectedCustomer(c)}
                    className="py-2.5 flex items-center justify-between text-xs cursor-pointer hover:bg-cream-medium/10 transition-colors rounded-lg px-2 -mx-2"
                  >
                    <div>
                      <p className="font-bold text-chocolate">{c.name.split(' ').slice(0, 2).join(' ')}</p>
                      <p className="text-[10px] text-chocolate-pale">{c.course}</p>
                    </div>
                    <span className="font-extrabold text-accent-gold bg-accent-gold/10 px-2 py-0.5 rounded-full border border-accent-gold/20">
                      {c.purchasesThisCycle}/10
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Customers Listing & Search */}
        <div className="lg:col-span-2 space-y-4 bg-cream-light border border-cream-dark rounded-2xl p-6 shadow-sm">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cream-medium pb-4">
            <h3 className="text-sm font-bold text-chocolate uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-chocolate" />
              Lista de Clientes
            </h3>
            
            {/* Search Input */}
            <div className="relative max-w-md w-full md:w-64">
              <Search className="w-4 h-4 text-chocolate-pale/60 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="🔎 Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-cream-medium/30 border border-cream-dark rounded-xl text-chocolate placeholder-chocolate-pale/50 focus:outline-none focus:ring-2 focus:ring-chocolate/15 focus:border-chocolate transition-all text-xs"
              />
            </div>
          </div>

          {/* Loader or Table */}
          {loading ? (
            <div className="py-20 text-center text-xs text-chocolate-pale flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-chocolate border-t-transparent rounded-full animate-spin" />
              Carregando dados dos clientes...
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="py-20 text-center text-xs text-chocolate-pale/75 italic border border-dashed border-cream-dark/50 rounded-xl bg-cream-medium/5">
              Nenhum cliente correspondente encontrado.
            </div>
          ) : (
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-cream-medium text-chocolate-pale font-bold text-[10px] uppercase tracking-wider">
                    <th className="py-3 px-3">Cliente</th>
                    <th className="py-3 px-3">Curso</th>
                    <th className="py-3 px-3 text-center">Progresso</th>
                    <th className="py-3 px-3 text-center">Prêmio</th>
                    <th className="py-3 px-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-medium">
                  {filteredCustomers.map(c => (
                    <tr 
                      key={c.id}
                      onClick={() => setSelectedCustomer(c)}
                      className="hover:bg-cream-medium/20 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-3 font-bold text-chocolate">{c.name}</td>
                      <td className="py-3.5 px-3 text-chocolate-pale">{c.course}</td>
                      <td className="py-3.5 px-3 text-center font-extrabold text-chocolate">
                        {c.purchasesThisCycle}/10
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        {c.rewardsAvailable > 0 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-emerald-100 border border-emerald-300 rounded-full text-emerald-800 font-extrabold animate-pulse" title={`${c.rewardsAvailable} prêmio(s) disponível(is)`}>
                            🎁
                          </span>
                        ) : (
                          <span className="text-chocolate-pale/40">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <ChevronRight className="w-4 h-4 text-chocolate-pale/50 inline" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>

      </div>

      {/* Selected Customer Modal */}
      {selectedCustomer && (
        <CustomerModal
          customer={selectedCustomer}
          adminEmail={adminEmail}
          onClose={() => setSelectedCustomer(null)}
          onDataChange={loadData}
        />
      )}

    </div>
  );
};
