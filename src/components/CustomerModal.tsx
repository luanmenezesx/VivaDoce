import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { X, Plus, Minus, Gift, Trash2, Calendar, User, Award, Clock } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  course: string;
  created_at: string;
}

interface HistoryItem {
  id: string;
  type: 'purchase' | 'redeem';
  quantity: number;
  description: string;
  created_at: string;
  created_by: string;
  purchase_id?: string;
}

interface CustomerModalProps {
  customer: Customer;
  onClose: () => void;
  adminEmail: string;
  onDataChange: () => void;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  customer,
  onClose,
  adminEmail,
  onDataChange,
}) => {
  const [purchasesThisCycle, setPurchasesThisCycle] = useState(0);
  const [rewardsAvailable, setRewardsAvailable] = useState(0);
  const [totalPurchases, setTotalPurchases] = useState(0);
  
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  const [loadingAction, setLoadingAction] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Load customer metrics and history
  const loadCustomerData = async () => {
    setLoadingHistory(true);
    try {
      // 1. Query current loyalty progress using RPC search
      const { data: searchData, error: searchError } = await supabase.rpc(
        'search_customer_loyalty',
        { p_name: customer.name, p_course: customer.course }
      );

      if (searchError) throw searchError;

      if (searchData && searchData.length > 0) {
        const info = searchData[0];
        setPurchasesThisCycle(info.purchases_this_cycle);
        setRewardsAvailable(info.rewards_available);
        setTotalPurchases(info.total_purchases);
      }

      // 2. Query history ordered by created_at descending
      const { data: historyData, error: historyError } = await supabase
        .from('loyalty_history')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });

      if (historyError) throw historyError;
      setHistory(historyData || []);

    } catch (err) {
      console.error('Error fetching customer details:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadCustomerData();
  }, [customer.id]);

  const handleIncrement = () => setPurchaseQuantity(prev => prev + 1);
  const handleDecrement = () => setPurchaseQuantity(prev => Math.max(1, prev - 1));

  const handleAddPurchase = async () => {
    setLoadingAction(true);
    try {
      const { error } = await supabase.from('purchases').insert({
        customer_id: customer.id,
        quantity: purchaseQuantity,
        created_by: adminEmail,
      });

      if (error) throw error;

      setPurchaseQuantity(1);
      await loadCustomerData();
      onDataChange();
    } catch (err) {
      console.error('Error adding purchase:', err);
      alert('Erro ao registrar a compra. Verifique sua conexão.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleRedeemReward = async () => {
    if (rewardsAvailable <= 0) return;
    if (!window.confirm('Confirmar o resgate de 1 Palha Italiana grátis?')) return;

    setLoadingAction(true);
    try {
      const { error } = await supabase.rpc('redeem_customer_reward', {
        p_customer_id: customer.id,
        p_redeemed_by: adminEmail,
      });

      if (error) throw error;

      await loadCustomerData();
      onDataChange();
    } catch (err) {
      console.error('Error redeeming reward:', err);
      alert('Erro ao resgatar o prêmio.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDeletePurchase = async (purchaseId: string, desc: string) => {
    if (!window.confirm(`Deseja realmente excluir o registro "${desc}"? O progresso e os prêmios do cliente serão recalculados automaticamente.`)) {
      return;
    }

    setLoadingAction(true);
    try {
      const { error } = await supabase
        .from('purchases')
        .delete()
        .eq('id', purchaseId);

      if (error) throw error;

      await loadCustomerData();
      onDataChange();
    } catch (err) {
      console.error('Error deleting purchase:', err);
      alert('Erro ao excluir a compra.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Helper to render the 10 stamps
  const renderStamps = (completed: number) => {
    const stamps = [];
    for (let i = 1; i <= 10; i++) {
      stamps.push(
        <div 
          key={i}
          className={`w-7 h-7 rounded-md border flex items-center justify-center text-sm font-bold ${
            i <= completed
              ? 'bg-chocolate border-chocolate text-cream-light shadow-sm'
              : 'border-chocolate-pale/30 text-chocolate-pale/20 bg-cream-medium/20'
          }`}
        >
          {i <= completed ? '🍫' : ''}
        </div>
      );
    }
    return stamps;
  };

  return (
    <div className="fixed inset-0 bg-chocolate/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-cream-light border border-cream-dark w-full max-w-lg rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-cream-medium flex items-start justify-between bg-cream-medium/40">
          <div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-chocolate/10 border border-chocolate/20 text-chocolate rounded-full text-[10px] font-bold mb-1">
              <User className="w-3 h-3" />
              Perfil do Cliente
            </span>
            <h3 className="text-xl font-bold text-chocolate">{customer.name}</h3>
            <p className="text-xs text-chocolate-pale font-medium mt-0.5">{customer.course}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-cream-dark/50 text-chocolate transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 no-scrollbar">
          
          {/* Progress and Stamp Card */}
          <div className="bg-cream-medium/20 border border-cream-dark/60 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-chocolate">
              <span className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-accent-gold" />
                Cartão de Fidelidade
              </span>
              <span>{purchasesThisCycle} / 10 Palhas</span>
            </div>

            {/* Stamps Grid */}
            <div className="flex flex-wrap gap-1.5 justify-center py-2 bg-cream-light border border-cream-dark/40 rounded-xl">
              {renderStamps(purchasesThisCycle)}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-1">
              <div className="bg-cream-light p-2 rounded-lg border border-cream-dark/30">
                <p className="text-chocolate-pale font-semibold">Ciclo Atual</p>
                <p className="text-sm font-extrabold text-chocolate">{purchasesThisCycle}/10</p>
              </div>
              <div className="bg-cream-light p-2 rounded-lg border border-cream-dark/30">
                <p className="text-chocolate-pale font-semibold">Total Compras</p>
                <p className="text-sm font-extrabold text-chocolate">{totalPurchases}</p>
              </div>
              <div className="bg-cream-light p-2 rounded-lg border border-cream-dark/30">
                <p className="text-chocolate-pale font-semibold">Prêmios Disp.</p>
                <p className={`text-sm font-extrabold ${rewardsAvailable > 0 ? 'text-emerald-700 animate-pulse' : 'text-chocolate'}`}>
                  {rewardsAvailable}
                </p>
              </div>
            </div>
          </div>

          {/* Action Boxes: Add Purchase & Redeem Rewards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Box 1: Add Purchase */}
            <div className="bg-cream-medium/20 border border-cream-dark/40 rounded-2xl p-4 flex flex-col justify-between space-y-4">
              <h4 className="text-xs font-bold text-chocolate uppercase tracking-wider">
                Registrar compras
              </h4>
              
              {/* Stepper */}
              <div className="flex items-center justify-center gap-4 bg-cream-light border border-cream-dark/40 py-1.5 px-3 rounded-xl max-w-[150px] mx-auto">
                <button 
                  onClick={handleDecrement}
                  disabled={purchaseQuantity <= 1 || loadingAction}
                  className="p-1 rounded-full text-chocolate hover:bg-cream-medium active:scale-90 transition-all disabled:opacity-30 cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-extrabold text-base text-chocolate w-6 text-center">
                  {purchaseQuantity}
                </span>
                <button 
                  onClick={handleIncrement}
                  disabled={loadingAction}
                  className="p-1 rounded-full text-chocolate hover:bg-cream-medium active:scale-90 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleAddPurchase}
                disabled={loadingAction}
                className="w-full py-2.5 bg-chocolate hover:bg-chocolate-light text-cream-light text-xs font-bold rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Confirmar compra
              </button>
            </div>

            {/* Box 2: Redeem Prize */}
            <div className="bg-cream-medium/20 border border-cream-dark/40 rounded-2xl p-4 flex flex-col justify-between space-y-4">
              <h4 className="text-xs font-bold text-chocolate uppercase tracking-wider">
                Controlar prêmios
              </h4>

              <div className="text-center py-2 flex flex-col items-center">
                {rewardsAvailable > 0 ? (
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 border border-emerald-300 rounded-full text-xs font-black text-emerald-800 animate-bounce">
                    <Gift className="w-3.5 h-3.5" />
                    {rewardsAvailable} Prêmio disponível
                  </div>
                ) : (
                  <span className="text-xs text-chocolate-pale/60">Nenhum prêmio disponível</span>
                )}
              </div>

              <button
                onClick={handleRedeemReward}
                disabled={rewardsAvailable <= 0 || loadingAction}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-600 disabled:bg-cream-medium disabled:text-chocolate-pale/50 disabled:border-cream-dark/40 disabled:shadow-none text-cream-light text-xs font-bold rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-700/10"
              >
                <Gift className="w-4 h-4" />
                Resgatar prêmio
              </button>
            </div>

          </div>

          {/* History ledger */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-chocolate uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Histórico do cliente
            </h4>

            {loadingHistory ? (
              <div className="text-center py-6 text-xs text-chocolate-pale flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-chocolate border-t-transparent rounded-full animate-spin" />
                Carregando histórico...
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 bg-cream-medium/10 border border-dashed border-cream-dark/50 rounded-xl text-xs text-chocolate-pale/80">
                Nenhuma atividade registrada para este cliente.
              </div>
            ) : (
              <div className="border border-cream-dark/40 rounded-2xl overflow-hidden bg-cream-light divide-y divide-cream-medium max-h-[220px] overflow-y-auto no-scrollbar">
                {history.map((item) => (
                  <div key={item.id} className="p-3 text-xs flex items-center justify-between hover:bg-cream-medium/10 transition-colors">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className={item.type === 'redeem' ? 'text-emerald-700 font-extrabold' : 'text-chocolate'}>
                          {item.description}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-chocolate-pale/80 font-medium">
                        <span className="flex items-center gap-0.5">
                          <Calendar className="w-2.5 h-2.5" />
                          {new Date(item.created_at).toLocaleDateString('pt-BR')} {new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span>•</span>
                        <span>Por: {item.created_by.split('@')[0]}</span>
                      </div>
                    </div>

                    {/* Action buttons on history (e.g. delete purchase) */}
                    {item.type === 'purchase' && item.purchase_id && (
                      <button
                        onClick={() => handleDeletePurchase(item.purchase_id!, item.description)}
                        disabled={loadingAction}
                        className="p-1.5 rounded-lg text-chocolate-pale/60 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Excluir compra"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
