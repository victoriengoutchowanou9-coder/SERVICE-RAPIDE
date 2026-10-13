# ⚡ SERVICE RAPIDE — Plateforme Panafricaine de Mise en Relation

Plateforme web moderne, responsive (mobile-first), connectant clients et prestataires à travers toute l'Afrique.

---

## 🛠️ Stack Technique

- **Front-end** : React 18, TypeScript, Tailwind CSS, Vite, Lucide Icons (Conception Mobile-First fluide).
- **Back-end** : NestJS 10, TypeORM, TypeScript, Class-Validator, Passport JWT.
- **Base de Données** : PostgreSQL 15+.
- **Paiements & Mobile Money** : MTN Mobile Money, Orange Money, Moov, Wave, etc.

---

## 📂 Structure du Projet

```text
SERVICE RAPIDE/
├── backend/                       # Application API NestJS
│   ├── src/
│   │   ├── common/
│   │   │   ├── constants/         # Pays d'Afrique et langues
│   │   │   ├── enums/             # Rôles, Disponibilité, Statuts Paiement & Remboursement
│   │   │   └── guards/            # JWT Strategy, Roles Guard
│   │   ├── entities/              # Entités TypeORM (PostgreSQL)
│   │   │   ├── user.entity.ts
│   │   │   ├── provider-profile.entity.ts
│   │   │   ├── contact-unlock.entity.ts
│   │   │   ├── payment.entity.ts
│   │   │   ├── refund-request.entity.ts
│   │   │   ├── advertisement.entity.ts
│   │   │   └── system-setting.entity.ts
│   │   ├── modules/
│   │   │   ├── auth/              # Authentification unique + Sélection Rôle + Métadonnées Géo
│   │   │   ├── provider/          # Profil Prestataire, Disponibilité 1 clic, Statut Abonnement
│   │   │   ├── client/            # Liste Prestataires (1 seul nom), Déblocage Contact, Remboursement
│   │   │   ├── payment/           # Abonnements 5000 FCFA & Déblocages 1000 FCFA Mobile Money
│   │   │   ├── ads/               # Publications sponsorisées et publicités géociblées
│   │   │   └── admin/             # Dashboard, Remboursements manuels, Gestion des tarifs & gratuité
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── .env                       # Paramètres DB, JWT & Tarifs
│   ├── tsconfig.json
│   └── package.json
│
├── frontend/                      # Application Front-End React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx         # Sélection pays africains + langues
│   │   │   ├── AuthView.tsx       # Interface unifiée Connexion/Inscription
│   │   │   ├── RoleSelectionModal.tsx # Choix du rôle Client ou Prestataire
│   │   │   ├── ProviderDashboard.tsx  # Disponibilité 1 clic, Reçoit sur place, Déplacement, 5000 FCFA
│   │   │   ├── ClientView.tsx     # Liste des prestataires (prénom seul, contact masqué), Remboursement
│   │   │   └── AdminDashboard.tsx # Supervision, Validation manuelle des remboursements, Paramètres
│   │   ├── types/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   └── package.json
└── README.md
```

---

## 🚀 Démarrage Rapide

### 1. Démarrer le Frontend (Test Immédiat)
```bash
cd frontend
npm run dev
```
Accédez à `http://localhost:5173`. Une barre de raccourcis démo située en haut permet de basculer instantanément entre la **Vue Client**, la **Vue Prestataire** et la **Vue Administrateur**.

### 2. Démarrer le Backend NestJS
Assurez-vous que PostgreSQL est lancé et configuré dans `backend/.env`.
```bash
cd backend
npm install
npm run start:dev
```
L'API démarre sur `http://localhost:3000`.

---

## 🎯 Conformité aux Règles Métier

1. **Authentification Unifiée** : Une seule interface de saisie. Si le compte n'existe pas, il est créé à la volée. Sélection immédiate du rôle (Client ou Prestataire), de la langue et du pays africain.
2. **Prestataire** :
   - Bascule de statut **Disponible / Occupé en un seul clic**.
   - Options « Reçoit sur place » et « Déplacement nécessaire avec frais de déplacement ».
   - Abonnement mensuel à 5 000 FCFA avec **1 mois gratuit offert**. Sans abonnement actif, le profil est masqué des résultats de recherche.
3. **Client** :
   - Affichage d'**un seul nom** (prénom) par prestataire dans la liste, avec sa ville et sa disponibilité. Contact masqué par défaut.
   - Mise en contact fixée à 1 000 FCFA avec **1 semaine gratuite** offerte à l'inscription.
   - **Règle stricte** : Si le prestataire est Occupé, la mise en contact est impossible et le contact reste bloqué.
4. **Remboursement** : Le client peut demander un remboursement en cas de litige. Chaque demande est soumise à la **validation manuelle d'un administrateur**.
5. **WhatsApp & Mobile Money** : Intégration de lien direct WhatsApp (`https://wa.me/...`) et support des moyens de paiement Mobile Money (Orange, MTN, Moov, Wave, etc.).
6. **Administration** : Dashboard complet avec métriques, validation manuelle des remboursements, gestion dynamique des prix et des périodes d'essai gratuit.
