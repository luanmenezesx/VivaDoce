import React, { useState } from 'react';
import { supabase } from '../supabase';
import { COURSES } from '../utils/courses';
import { Search, Gift, Award, Sparkles, AlertCircle, Calendar, Clock, ChevronLeft } from 'lucide-react';

interface LoyaltyCardData {
  customer_id: string;
  customer_name: string;
  customer_course: string;
  purchases_this_cycle: number;
  missing_for_next_reward: number;
  rewards_available: number;
  total_purchases: number;
}

interface CustomerPurchase {
  id: string;
  quantity: number;
  description: string;
  created_at: string;
  type: 'purchase' | 'redeem';
}

const formatHistoryDescription = (desc: string) => {
  if (!desc) return '';
  return desc
    .replace(/Palhaas/gi, 'Palhas')
    .replace(/Italianaas/gi, 'Italianas');
};

export const ClientView: React.FC = () => {
  const [name, setName] = useState('');
  const [course, setCourse] = useState('');
  const [loading, setLoading] = useState(false);
  const [cardData, setCardData] = useState<LoyaltyCardData | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [historyList, setHistoryList] = useState<CustomerPurchase[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);

  const loadPurchases = async (custName: string, custCourse: string, custId: string) => {
    setLoadingPurchases(true);
    setHistoryList([]);
    try {
      // 1. Tenta buscar pela função RPC segura (SECURITY DEFINER)
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_customer_history', {
        p_name: custName,
        p_course: custCourse,
      });

      if (!rpcError && rpcData && rpcData.length > 0) {
        setHistoryList(rpcData as CustomerPurchase[]);
        return;
      }

      // 2. Fallback: consulta direta à tabela loyalty_history
      const { data: directData, error: directError } = await supabase
        .from('loyalty_history')
        .select('id, quantity, description, created_at, type')
        .eq('customer_id', custId)
        .order('created_at', { ascending: false });

      if (!directError && directData) {
        setHistoryList(directData as CustomerPurchase[]);
      }
    } catch (err) {
      console.error('Error fetching purchases history for client:', err);
    } finally {
      setLoadingPurchases(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !course) return;

    setLoading(true);
    setSearchError(null);
    setCardData(null);
    setHistoryList([]);

    try {
      const { data, error } = await supabase.rpc('search_customer_loyalty', {
        p_name: name.trim(),
        p_course: course,
      });

      if (error) {
        if (error.message && error.message.includes('DUPLICATE_CUSTOMER')) {
          setSearchError('duplicate');
        } else {
          console.error(error);
          setSearchError(error.message || 'Erro desconhecido');
        }
      } else if (data && data.length > 0) {
        const found = data[0] as LoyaltyCardData;
        setCardData(found);
        loadPurchases(name.trim(), course, found.customer_id);
      } else {
        setSearchError('not_found');
      }
    } catch (err: any) {
      console.error(err);
      setSearchError(err.message || 'Erro de conexão');
    } finally {
      setLoading(false);
    }
  };


  // Helper to render the 10 chocolate card grid
  const renderChocolateGrid = (completed: number) => {
    const chocolates = [];
    for (let i = 1; i <= 10; i++) {
      if (i <= completed) {
        chocolates.push(
          <div 
            key={i} 
            className="w-10 h-10 md:w-12 md:h-12 bg-cream-light border border-chocolate rounded-lg shadow-sm flex items-center justify-center text-xl md:text-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 animate-bounce-subtle"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            🍫
          </div>
        );
      } else {
        chocolates.push(
          <div 
            key={i} 
            className="w-10 h-10 md:w-12 md:h-12 bg-cream-medium/40 border border-dashed border-chocolate-pale/50 rounded-lg flex items-center justify-center text-xl md:text-2xl opacity-40"
          >
            ⬜
          </div>
        );
      }
    }
    return chocolates;
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
      {/* Hero Header */}
      {!cardData && (
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-chocolate tracking-tight mb-2">
            🍫 Cartão de Fidelidade
          </h1>
          <p className="text-chocolate-pale font-medium text-sm md:text-base">
            Compre 10 Palhas Italianas e ganhe 1 grátis! 🎁
          </p>
        </div>
      )}

      {/* Main card */}
      <div className="w-full bg-cream-light border border-cream-dark shadow-lg rounded-3xl p-6 md:p-8 transition-all duration-300">
        {!cardData ? (
          /* SEARCH STATE */
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="text-center border-b border-cream-medium pb-4 mb-4">
              <h2 className="text-lg font-bold text-chocolate flex items-center justify-center gap-2">
                <Award className="w-5 h-5 text-accent-gold" />
                Consulte seu cartão de fidelidade
              </h2>
              <p className="text-xs text-chocolate-pale">Informe seus dados para ver seu progresso</p>
            </div>

            {/* Error messaging */}
            {searchError === 'not_found' && (
              <div className="bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-200 text-xs flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <div>
                  <p className="font-semibold">Cliente não encontrado</p>
                  <p className="mt-0.5 opacity-90">Verifique se escreveu seu nome e selecionou seu curso corretamente.</p>
                </div>
              </div>
            )}

            {searchError === 'duplicate' && (
              <div className="bg-red-50 text-red-800 p-4 rounded-xl border border-red-200 text-xs flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <div>
                  <p className="font-semibold">Duplicidade encontrada</p>
                  <p className="mt-0.5 opacity-90">Existe mais de um cliente cadastrado com este nome e curso. Por favor, fale com o administrador para corrigir.</p>
                </div>
              </div>
            )}

            {searchError && searchError !== 'not_found' && searchError !== 'duplicate' && (
              <div className="bg-red-50 text-red-800 p-4 rounded-xl border border-red-200 text-xs flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Erro na busca (Supabase)</p>
                  <p className="mt-0.5 opacity-90">{searchError}</p>
                </div>
              </div>
            )}

            {/* Fields */}
            <div className="space-y-4">
              <div>
                <label htmlFor="client-name" className="block text-xs font-bold text-chocolate uppercase tracking-wider mb-1.5">
                  Seu nome completo
                </label>
                <input
                  id="client-name"
                  type="text"
                  placeholder="Ex: Luan Guilherme"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-cream-medium/50 border border-cream-dark rounded-xl text-chocolate placeholder-chocolate-pale/50 focus:outline-none focus:ring-2 focus:ring-chocolate/20 focus:border-chocolate transition-all text-sm"
                />
              </div>

              <div>
                <label htmlFor="client-course" className="block text-xs font-bold text-chocolate uppercase tracking-wider mb-1.5">
                  Seu curso
                </label>
                <select
                  id="client-course"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-cream-medium/50 border border-cream-dark rounded-xl text-chocolate focus:outline-none focus:ring-2 focus:ring-chocolate/20 focus:border-chocolate transition-all text-sm appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234A3728' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 16px center',
                    backgroundSize: '16px'
                  }}
                >
                  <option value="" disabled>Selecione seu curso...</option>
                  {COURSES.map((c) => (
                    <option key={c} value={c} className="text-chocolate">
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-chocolate hover:bg-chocolate-light text-cream-light font-bold rounded-xl shadow-md shadow-chocolate/10 hover:shadow-chocolate/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-cream-light border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Consultar meu cartão
                </>
              )}
            </button>
          </form>
        ) : (
          /* RESULT STATE */
          <div className="space-y-6">
            {/* Header Greeting */}
            <div className="text-center relative">
              <h2 className="text-2xl font-black text-chocolate flex items-center justify-center gap-1.5">
                Olá, {cardData.customer_name.split(' ')[0]}! 👋
              </h2>
              <p className="text-xs text-chocolate-pale font-medium mt-1">
                {cardData.customer_course}
              </p>
            </div>

            {/* The Fidelity Digital Stamp Card */}
            <div className="bg-cream-medium/40 border border-cream-dark/60 rounded-2xl p-4 flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-chocolate-pale tracking-widest mb-3">
                Seu cartão de fidelidade
              </span>

              {/* Stamper Grid */}
              <div className="grid grid-cols-5 gap-3 mb-4">
                {renderChocolateGrid(cardData.purchases_this_cycle)}
              </div>

              {/* Progress text */}
              <div className="w-full flex items-center justify-between mt-2 text-xs font-bold text-chocolate">
                <span>{cardData.purchases_this_cycle} / 10 Palhas</span>
                <span className="bg-chocolate/10 px-2 py-0.5 rounded-full text-[10px]">
                  {cardData.purchases_this_cycle * 10}%
                </span>
              </div>

              {/* Progress bar container */}
              <div className="w-full h-3.5 bg-cream-medium border border-cream-dark rounded-full overflow-hidden mt-1.5 shadow-inner">
                <div 
                  className="h-full bg-chocolate rounded-full transition-all duration-1000 ease-out relative"
                  style={{ width: `${cardData.purchases_this_cycle * 10}%` }}
                >
                  {/* Subtle shimmer effect on the progress bar */}
                  <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent w-[30%] animate-[shimmer_2s_infinite]" />
                </div>
              </div>
            </div>

            {/* Prize availability box */}
            {cardData.rewards_available > 0 ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 p-5 rounded-2xl text-center space-y-2 relative overflow-hidden animate-pulse">
                {/* Micro celebration stars */}
                <div className="absolute top-2 left-2 text-emerald-300"><Sparkles className="w-4 h-4" /></div>
                <div className="absolute bottom-2 right-2 text-emerald-300"><Sparkles className="w-4 h-4" /></div>
                
                <h3 className="text-lg font-black flex items-center justify-center gap-1.5">
                  🎉 PARABÉNS!
                </h3>
                <p className="text-sm font-bold">
                  Você ganhou uma Palha Italiana grátis! 🎁
                </p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 border border-emerald-300 rounded-full text-xs font-black text-emerald-800">
                  <Gift className="w-3.5 h-3.5" />
                  Prêmio disponível: {cardData.rewards_available}
                </div>
                <p className="text-[10px] text-emerald-700/80 leading-normal">
                  Fale com o administrador para realizar o resgate do seu prêmio.
                </p>
              </div>
            ) : (
              /* Missing message */
              <div className="bg-cream-medium/20 border border-cream-dark/40 rounded-xl p-4 text-center">
                <p className="text-sm font-bold text-chocolate">
                  Faltam apenas <span className="text-accent-gold font-extrabold text-base">{cardData.missing_for_next_reward}</span> Palha{cardData.missing_for_next_reward > 1 ? 's' : ''} para você ganhar uma palha grátis! 🎁
                </p>
              </div>
            )}

            {/* Aviso de Prêmios já resgatados */}
            {historyList.some(i => i.type === 'redeem') && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 p-3 rounded-2xl flex items-center gap-3 shadow-xs">
                <div className="w-9 h-9 bg-emerald-100 border border-emerald-300 rounded-xl flex items-center justify-center text-lg shrink-0">
                  🎁
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-emerald-900 leading-tight">
                    {historyList.filter(i => i.type === 'redeem').reduce((s, i) => s + (i.quantity || 1), 0)} Prêmio resgatado!
                  </p>
                  <p className="text-[10px] text-emerald-700/80 mt-0.5">
                    Parabéns! Você já completou seu cartão fidelidade e retirou sua Palha Italiana grátis.
                  </p>
                </div>
              </div>
            )}

            {/* Quick breakdown stats */}
            {(() => {
              const redeemedCount = historyList
                .filter(i => i.type === 'redeem')
                .reduce((s, i) => s + (i.quantity || 1), 0);

              return (
                <div className={`border-t border-cream-medium pt-4 grid ${redeemedCount > 0 ? 'grid-cols-3' : 'grid-cols-2'} gap-2.5 text-center text-xs`}>
                  <div className="bg-cream-medium/20 p-2.5 rounded-xl border border-cream-dark/30">
                    <p className="text-chocolate-pale font-medium text-[10px] uppercase tracking-wider">Ciclo Atual</p>
                    <p className="text-base font-extrabold text-chocolate">{cardData.purchases_this_cycle}/10</p>
                  </div>
                  <div className="bg-cream-medium/20 p-2.5 rounded-xl border border-cream-dark/30">
                    <p className="text-chocolate-pale font-medium text-[10px] uppercase tracking-wider">Prêmios Disp.</p>
                    <p className={`text-base font-extrabold ${cardData.rewards_available > 0 ? 'text-emerald-700 animate-pulse' : 'text-chocolate'}`}>
                      {cardData.rewards_available}
                    </p>
                  </div>
                  {redeemedCount > 0 && (
                    <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200">
                      <p className="text-emerald-800 font-medium text-[10px] uppercase tracking-wider">Resgatados</p>
                      <p className="text-base font-extrabold text-emerald-900">
                        {redeemedCount} 🎁
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Histórico de Compras e Prêmios (Somente Leitura) */}
            <div className="border-t border-cream-medium pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-chocolate uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-accent-gold" />
                  Compras e prêmios
                </h3>
                <span className="text-[10px] text-chocolate-pale font-medium bg-cream-medium/50 px-2 py-0.5 rounded-full border border-cream-dark/40">
                  Somente leitura
                </span>
              </div>

              {loadingPurchases ? (
                <div className="text-center py-6 text-xs text-chocolate-pale flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-chocolate border-t-transparent rounded-full animate-spin" />
                  Carregando compras...
                </div>
              ) : historyList.length === 0 ? (
                <div className="p-4 bg-cream-medium/20 border border-dashed border-cream-dark/40 rounded-xl text-center text-xs text-chocolate-pale">
                  Nenhuma compra encontrada no histórico.
                </div>
              ) : (
                <div className="divide-y divide-cream-medium/70 border border-cream-dark/40 rounded-2xl bg-cream-medium/10 overflow-hidden max-h-[240px] overflow-y-auto no-scrollbar">
                  {historyList.map((item) => (
                    <div key={item.id} className="p-3 flex items-center justify-between text-xs hover:bg-cream-medium/20 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg">{item.type === 'redeem' ? '🎁' : '🍫'}</span>
                        <div>
                          <p className={`font-bold leading-tight ${item.type === 'redeem' ? 'text-emerald-800 font-extrabold' : 'text-chocolate'}`}>
                            {item.type === 'redeem' ? '🎁 Prêmio resgatado (Palha Grátis)' : formatHistoryDescription(item.description)}
                          </p>
                          <p className="text-[10px] text-chocolate-pale flex items-center gap-1 mt-0.5 font-medium">
                            <Calendar className="w-2.5 h-2.5" />
                            {new Date(item.created_at).toLocaleDateString('pt-BR')} às {new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs font-black px-2.5 py-1 rounded-lg border shadow-2xs shrink-0 ${
                        item.type === 'redeem' 
                          ? 'text-emerald-800 bg-emerald-100 border-emerald-300' 
                          : 'text-chocolate bg-cream-light border-cream-dark/40'
                      }`}>
                        {item.type === 'redeem' ? 'Resgatado' : `+${item.quantity}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Botão para Nova Consulta */}
            <div className="pt-2 border-t border-cream-medium">
              <button
                type="button"
                onClick={() => {
                  setCardData(null);
                  setHistoryList([]);
                  setName('');
                  setCourse('');
                }}
                className="w-full py-2.5 bg-cream-medium/70 hover:bg-cream-dark/40 text-chocolate text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                Consultar outro cartão
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mensagem aparente de contabilização */}
      <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-cream-light border border-cream-dark/80 rounded-full shadow-xs text-xs font-bold text-chocolate">
        <Calendar className="w-4 h-4 text-accent-gold shrink-0" />
        <span>Contabilizando desde o dia 12 de agosto</span>
      </div>

      {/* Footer Info */}
      <div className="mt-5 text-center text-[10px] text-chocolate-pale flex flex-col gap-1">
        <span>Viva Doce © {new Date().getFullYear()}</span>
        <span className="opacity-70">Somente o administrador pode registrar compras e prêmios.</span>
      </div>
    </div>
  );
};
