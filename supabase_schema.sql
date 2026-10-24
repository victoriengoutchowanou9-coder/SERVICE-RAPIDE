-- ====================================================================
-- SERVICE RAPIDE — SCHÉMA COMPLET POSTGRESQL (SUPABASE)
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM ('CLIENT', 'PROVIDER', 'ADMIN', 'PENDING');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE availability_status_enum AS ENUM ('AVAILABLE', 'BUSY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_type_enum AS ENUM ('PROVIDER_SUBSCRIPTION', 'CLIENT_CONTACT_UNLOCK');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status_enum AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE refund_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method_enum AS ENUM ('MTN_MOMO', 'ORANGE_MONEY', 'MOOV_MONEY', 'WAVE', 'AIRTEL_MONEY', 'MPESA', 'FREE_TRIAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABLE USERS
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    role user_role_enum DEFAULT 'PENDING',
    "firstName" VARCHAR(100),
    "lastName" VARCHAR(100),
    "phoneNumber" VARCHAR(50),
    "avatarUrl" TEXT,
    "countryCode" VARCHAR(10) DEFAULT 'CI',
    "preferredLanguage" VARCHAR(10) DEFAULT 'fr',
    "clientTrialExpiresAt" TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLE PROVIDER PROFILES
CREATE TABLE IF NOT EXISTS provider_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "singleName" VARCHAR(100) NOT NULL,
    "fullName" VARCHAR(255),
    "photoUrl" TEXT,
    "serviceOffered" VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    availability availability_status_enum DEFAULT 'AVAILABLE',
    "receivesOnSite" BOOLEAN DEFAULT TRUE,
    "travelRequired" BOOLEAN DEFAULT FALSE,
    "travelFee" NUMERIC(10, 2) DEFAULT 0,
    "basePrice" NUMERIC(10, 2) DEFAULT 5000,
    "pricingUnit" VARCHAR(100) DEFAULT 'par prestation',
    "whatsappNumber" VARCHAR(50),
    "directPhoneNumber" VARCHAR(50),
    "subscriptionExpiresAt" TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    "isTrialUsed" BOOLEAN DEFAULT TRUE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABLE PAYMENTS (MOBILE MONEY & ABONNEMENTS)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type payment_type_enum NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'XOF',
    method payment_method_enum DEFAULT 'MTN_MOMO',
    status payment_status_enum DEFAULT 'COMPLETED',
    "transactionReference" VARCHAR(255),
    "phoneNumberUsed" VARCHAR(50),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABLE CONTACT UNLOCKS (MISES EN RELATION)
CREATE TABLE IF NOT EXISTS contact_unlocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "clientId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "providerId" UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    "paymentId" UUID REFERENCES payments(id) ON DELETE SET NULL,
    "isUnlockedViaTrial" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TABLE REFUND REQUESTS (VALIDATION MANUELLE ADMIN)
CREATE TABLE IF NOT EXISTS refund_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "clientId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "unlockId" UUID NOT NULL REFERENCES contact_unlocks(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status refund_status_enum DEFAULT 'PENDING',
    "adminComment" TEXT,
    "reviewedByAdminId" VARCHAR(255),
    "reviewedAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. TABLE PROVIDER POSTS (FIL D'ACTUALITÉ & LOCALISATION)
CREATE TABLE IF NOT EXISTS provider_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "authorId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "authorSingleName" VARCHAR(100) NOT NULL,
    "authorPhotoUrl" TEXT,
    "authorService" VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    department VARCHAR(100) DEFAULT '',
    "mapLocationHint" VARCHAR(255),
    content TEXT NOT NULL,
    "imageUrl" TEXT,
    "likesCount" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. TABLE ADVERTISEMENTS (PUBLICITÉS PANAFRICAINES)
CREATE TABLE IF NOT EXISTS advertisements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    "imageUrl" TEXT,
    "targetUrl" TEXT,
    "targetCountryCode" VARCHAR(10) DEFAULT 'ALL',
    "isActive" BOOLEAN DEFAULT TRUE,
    "viewsCount" INTEGER DEFAULT 0,
    "clicksCount" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. TABLE SYSTEM SETTINGS (PRIX ET DURÉES D'ESSAI DYNAMIQUES)
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "settingKey" VARCHAR(100) UNIQUE NOT NULL,
    "settingValue" VARCHAR(255) NOT NULL,
    description TEXT,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. INSERTION DES PARAMETRES SYSTEME PAR DEFAUT
INSERT INTO system_settings ("settingKey", "settingValue", description)
VALUES 
    ('PROVIDER_SUBSCRIPTION_PRICE', '5000', 'Prix abonnement mensuel prestataire en FCFA'),
    ('PROVIDER_FREE_TRIAL_MONTHS', '1', 'Mois gratuit offert avant le premier abonnement'),
    ('CLIENT_CONTACT_PRICE', '1000', 'Prix de mise en contact client en FCFA'),
    ('CLIENT_FREE_TRIAL_DAYS', '7', 'Semaine gratuite offerte au nouveau client')
ON CONFLICT ("settingKey") DO NOTHING;
