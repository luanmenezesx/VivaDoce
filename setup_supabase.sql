-- Script de Configuração do Banco de Dados Supabase (Viva Doce)
-- Copie e cole este script no SQL Editor do seu projeto Supabase.

-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    course TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de Compras
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by TEXT NOT NULL -- E-mail do administrador logado
);

-- Tabela de Prêmios
CREATE TABLE IF NOT EXISTS public.rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    status TEXT NOT NULL CHECK (status IN ('available', 'redeemed')) DEFAULT 'available',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    redeemed_at TIMESTAMPTZ,
    redeemed_by TEXT -- E-mail do administrador logado
);

-- Tabela de Histórico de Fidelidade
CREATE TABLE IF NOT EXISTS public.loyalty_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('purchase', 'redeem')),
    quantity INTEGER NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by TEXT NOT NULL,
    purchase_id UUID REFERENCES public.purchases(id) ON DELETE CASCADE
);

-- =========================================================================
-- FUNÇÕES E TRIGGERS DE LOG E RECALCULO
-- =========================================================================

-- Função Auxiliar: Recalcula prêmios para um cliente específico
CREATE OR REPLACE FUNCTION public.recalculate_single_customer(p_customer_id UUID)
RETURNS VOID AS $$
DECLARE
    v_total_purchases INT;
    v_redeemed_count INT;
    v_should_total_rewards INT;
    v_available_needed INT;
BEGIN
    -- 1. Calcular total de compras
    SELECT COALESCE(SUM(p.quantity), 0)
    INTO v_total_purchases
    FROM public.purchases p
    WHERE p.customer_id = p_customer_id;

    -- 2. Calcular quantos prêmios já foram resgatados
    SELECT COALESCE(SUM(r.quantity), 0)
    INTO v_redeemed_count
    FROM public.rewards r
    WHERE r.customer_id = p_customer_id AND r.status = 'redeemed';

    -- 3. Calcular quantos prêmios deveriam ter sido gerados no total (1 a cada 10 compras)
    v_should_total_rewards := floor(v_total_purchases / 10);

    -- 4. Diferença para saber quantos prêmios disponíveis devemos ter
    v_available_needed := v_should_total_rewards - v_redeemed_count;
    IF v_available_needed < 0 THEN
        v_available_needed := 0;
    END IF;

    -- 5. Atualizar tabela de prêmios:
    DELETE FROM public.rewards r
    WHERE r.customer_id = p_customer_id AND r.status = 'available';

    IF v_available_needed > 0 THEN
        INSERT INTO public.rewards (customer_id, quantity, status, created_at)
        VALUES (p_customer_id, v_available_needed, 'available', now());
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Recalcula fidelidade após alteração de compras
CREATE OR REPLACE FUNCTION public.recalculate_customer_loyalty()
RETURNS TRIGGER AS $$
DECLARE
    v_cust_id UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_cust_id := OLD.customer_id;
        PERFORM public.recalculate_single_customer(v_cust_id);
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.customer_id != NEW.customer_id THEN
            PERFORM public.recalculate_single_customer(OLD.customer_id);
        END IF;
        v_cust_id := NEW.customer_id;
        PERFORM public.recalculate_single_customer(v_cust_id);
    ELSE
        v_cust_id := NEW.customer_id;
        PERFORM public.recalculate_single_customer(v_cust_id);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recalculate_loyalty ON public.purchases;
CREATE TRIGGER trg_recalculate_loyalty
AFTER INSERT OR UPDATE OR DELETE ON public.purchases
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_customer_loyalty();

-- Trigger: Registra histórico de compra automaticamente
CREATE OR REPLACE FUNCTION public.log_purchase_history()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.loyalty_history (customer_id, type, quantity, description, created_by, created_at, purchase_id)
    VALUES (
        NEW.customer_id, 
        'purchase', 
        NEW.quantity, 
        '+' || NEW.quantity || ' Palha' || CASE WHEN NEW.quantity > 1 THEN 'as' ELSE '' END || ' Italiana' || CASE WHEN NEW.quantity > 1 THEN 'as' ELSE '' END, 
        NEW.created_by, 
        NEW.created_at, 
        NEW.id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_purchase_history ON public.purchases;
CREATE TRIGGER trg_log_purchase_history
AFTER INSERT ON public.purchases
FOR EACH ROW
EXECUTE FUNCTION public.log_purchase_history();

-- =========================================================================
-- FUNÇÕES SQL / RPC PARA O FRONTEND
-- =========================================================================

-- RPC Pública: Busca o progresso de fidelidade de um cliente (Nome + Curso)
CREATE OR REPLACE FUNCTION public.search_customer_loyalty(
    p_name TEXT,
    p_course TEXT
)
RETURNS TABLE (
    customer_id UUID,
    customer_name TEXT,
    customer_course TEXT,
    purchases_this_cycle INT,
    missing_for_next_reward INT,
    rewards_available INT,
    total_purchases INT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_customer_count INT;
    v_cust_id UUID;
    v_cust_name TEXT;
    v_cust_course TEXT;
    v_total_purchases INT;
    v_rewards_available INT;
    v_purchases_this_cycle INT;
    v_missing INT;
BEGIN
    SELECT COUNT(*)
    INTO v_customer_count
    FROM public.customers c
    WHERE LOWER(TRIM(c.name)) = LOWER(TRIM(p_name))
      AND LOWER(TRIM(c.course)) = LOWER(TRIM(p_course));

    IF v_customer_count > 1 THEN
        RAISE EXCEPTION 'DUPLICATE_CUSTOMER';
    ELSIF v_customer_count = 0 THEN
        RETURN;
    END IF;

    SELECT c.id, c.name, c.course
    INTO v_cust_id, v_cust_name, v_cust_course
    FROM public.customers c
    WHERE LOWER(TRIM(c.name)) = LOWER(TRIM(p_name))
      AND LOWER(TRIM(c.course)) = LOWER(TRIM(p_course));

    SELECT COALESCE(SUM(pur.quantity), 0)
    INTO v_total_purchases
    FROM public.purchases pur
    WHERE pur.customer_id = v_cust_id;

    SELECT COALESCE(SUM(rew.quantity), 0)
    INTO v_rewards_available
    FROM public.rewards rew
    WHERE rew.customer_id = v_cust_id AND rew.status = 'available';

    v_purchases_this_cycle := v_total_purchases % 10;
    v_missing := 10 - v_purchases_this_cycle;

    RETURN QUERY
    SELECT 
        v_cust_id AS customer_id,
        v_cust_name AS customer_name,
        v_cust_course AS customer_course,
        v_purchases_this_cycle AS purchases_this_cycle,
        v_missing AS missing_for_next_reward,
        v_rewards_available AS rewards_available,
        v_total_purchases AS total_purchases;
END;
$$;

-- RPC Privada: Resgate de prêmio pelo Administrador
CREATE OR REPLACE FUNCTION public.redeem_customer_reward(
    p_customer_id UUID,
    p_redeemed_by TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_reward_id UUID;
    v_reward_qty INT;
BEGIN
    IF auth.role() != 'authenticated' THEN
        RAISE EXCEPTION 'UNAUTHORIZED';
    END IF;

    SELECT r.id, r.quantity
    INTO v_reward_id, v_reward_qty
    FROM public.rewards r
    WHERE r.customer_id = p_customer_id AND r.status = 'available'
    LIMIT 1;

    IF v_reward_id IS NULL THEN
        RAISE EXCEPTION 'NO_REWARDS_AVAILABLE';
    END IF;

    IF v_reward_qty = 1 THEN
        UPDATE public.rewards r
        SET status = 'redeemed',
            redeemed_at = now(),
            redeemed_by = p_redeemed_by
        WHERE r.id = v_reward_id;
    ELSE
        UPDATE public.rewards r
        SET quantity = r.quantity - 1
        WHERE r.id = v_reward_id;

        INSERT INTO public.rewards (customer_id, quantity, status, created_at, redeemed_at, redeemed_by)
        VALUES (p_customer_id, 1, 'redeemed', now(), now(), p_redeemed_by);
    END IF;

    INSERT INTO public.loyalty_history (customer_id, type, quantity, description, created_by, created_at)
    VALUES (p_customer_id, 'redeem', 1, '🎁 Prêmio resgatado', p_redeemed_by, now());
END;
$$;

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) E POLÍTICAS DE ACESSO
-- =========================================================================
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_all_customers ON public.customers;
DROP POLICY IF EXISTS admin_all_purchases ON public.purchases;
DROP POLICY IF EXISTS admin_all_rewards ON public.rewards;
DROP POLICY IF EXISTS admin_all_history ON public.loyalty_history;

CREATE POLICY admin_all_customers ON public.customers FOR ALL TO authenticated USING (true);
CREATE POLICY admin_all_purchases ON public.purchases FOR ALL TO authenticated USING (true);
CREATE POLICY admin_all_rewards ON public.rewards FOR ALL TO authenticated USING (true);
CREATE POLICY admin_all_history ON public.loyalty_history FOR ALL TO authenticated USING (true);
