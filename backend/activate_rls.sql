-- ====================================================================
-- ACTIVATION DE ROW LEVEL SECURITY (RLS) SUR TOUTES LES TABLES
-- ====================================================================

-- 1. Activer RLS sur toutes les tables existantes
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- 2. Supprimer les anciennes politiques si existantes pour éviter les doublons
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- ====================================================================
-- POLICIES : UTILISATEURS (users)
-- ====================================================================
-- Lecture : l'utilisateur lit son propre profil
CREATE POLICY "Users read own profile" ON users
    FOR SELECT USING (auth.uid() = id OR current_setting('request.jwt.claim.sub', true)::uuid = id);

-- Modification : l'utilisateur ne modifie que son propre profil
CREATE POLICY "Users update own profile" ON users
    FOR UPDATE USING (auth.uid() = id OR current_setting('request.jwt.claim.sub', true)::uuid = id);

-- Suppression : l'utilisateur ne supprime que son propre profil
CREATE POLICY "Users delete own profile" ON users
    FOR DELETE USING (auth.uid() = id OR current_setting('request.jwt.claim.sub', true)::uuid = id);

-- Insertion : création à l'inscription
CREATE POLICY "Users self register insert" ON users
    FOR INSERT WITH CHECK (true);

-- ====================================================================
-- POLICIES : PROFILS PRESTATAIRES (provider_profiles)
-- ====================================================================
-- Lecture : les profils actifs sont lisibles par tous (avec abonnement actif ou essai)
CREATE POLICY "Providers viewable if subscribed" ON provider_profiles
    FOR SELECT USING (
        "subscriptionExpiresAt" > NOW() OR "userId" = auth.uid() OR "userId" = current_setting('request.jwt.claim.sub', true)::uuid
    );

-- Modification : seul le propriétaire peut modifier son profil
CREATE POLICY "Providers update own profile" ON provider_profiles
    FOR UPDATE USING ("userId" = auth.uid() OR "userId" = current_setting('request.jwt.claim.sub', true)::uuid);

-- Suppression : seul le propriétaire peut supprimer son profil
CREATE POLICY "Providers delete own profile" ON provider_profiles
    FOR DELETE USING ("userId" = auth.uid() OR "userId" = current_setting('request.jwt.claim.sub', true)::uuid);

-- Insertion : création par l'utilisateur
CREATE POLICY "Providers insert own profile" ON provider_profiles
    FOR INSERT WITH CHECK ("userId" = auth.uid() OR "userId" = current_setting('request.jwt.claim.sub', true)::uuid);

-- ====================================================================
-- POLICIES : PAIEMENTS (payments)
-- ====================================================================
-- Seul le propriétaire peut voir ses transactions
CREATE POLICY "Users read own payments" ON payments
    FOR SELECT USING ("userId" = auth.uid() OR "userId" = current_setting('request.jwt.claim.sub', true)::uuid);

CREATE POLICY "Users insert own payments" ON payments
    FOR INSERT WITH CHECK ("userId" = auth.uid() OR "userId" = current_setting('request.jwt.claim.sub', true)::uuid);

-- ====================================================================
-- POLICIES : MISES EN RELATION (contact_unlocks)
-- ====================================================================
-- Le client ou le prestataire concerné peuvent voir le déblocage
CREATE POLICY "Users read relevant unlocks" ON contact_unlocks
    FOR SELECT USING (
        "clientId" = auth.uid() OR 
        "clientId" = current_setting('request.jwt.claim.sub', true)::uuid OR
        "providerId" IN (SELECT id FROM provider_profiles WHERE "userId" = auth.uid() OR "userId" = current_setting('request.jwt.claim.sub', true)::uuid)
    );

CREATE POLICY "Clients insert unlock" ON contact_unlocks
    FOR INSERT WITH CHECK ("clientId" = auth.uid() OR "clientId" = current_setting('request.jwt.claim.sub', true)::uuid);

-- ====================================================================
-- POLICIES : DEMANDES DE REMBOURSEMENT (refund_requests)
-- ====================================================================
-- Le client ne voit et ne soumet que ses demandes de remboursement
CREATE POLICY "Clients read own refunds" ON refund_requests
    FOR SELECT USING ("clientId" = auth.uid() OR "clientId" = current_setting('request.jwt.claim.sub', true)::uuid);

CREATE POLICY "Clients insert own refunds" ON refund_requests
    FOR INSERT WITH CHECK ("clientId" = auth.uid() OR "clientId" = current_setting('request.jwt.claim.sub', true)::uuid);

-- ====================================================================
-- POLICIES : PUBLICATIONS PRESTATAIRES (provider_posts)
-- ====================================================================
-- Tout le monde peut voir les publications
CREATE POLICY "Public read posts" ON provider_posts
    FOR SELECT USING (true);

-- Seul l'auteur peut modifier ou supprimer ses publications
CREATE POLICY "Authors update own posts" ON provider_posts
    FOR UPDATE USING ("authorId" = auth.uid() OR "authorId" = current_setting('request.jwt.claim.sub', true)::uuid);

CREATE POLICY "Authors delete own posts" ON provider_posts
    FOR DELETE USING ("authorId" = auth.uid() OR "authorId" = current_setting('request.jwt.claim.sub', true)::uuid);

CREATE POLICY "Authors insert own posts" ON provider_posts
    FOR INSERT WITH CHECK ("authorId" = auth.uid() OR "authorId" = current_setting('request.jwt.claim.sub', true)::uuid);

-- ====================================================================
-- POLICIES : PUBLICITÉS & PARAMÈTRES
-- ====================================================================
CREATE POLICY "Public read active ads" ON advertisements
    FOR SELECT USING ("isActive" = true);

CREATE POLICY "Public read settings" ON system_settings
    FOR SELECT USING (true);
