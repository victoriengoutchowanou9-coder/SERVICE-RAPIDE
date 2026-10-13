export enum UserRole {
  CLIENT = 'CLIENT',
  PROVIDER = 'PROVIDER',
  ADMIN = 'ADMIN',
  PENDING = 'PENDING', // Utilisateur nouvellement inscrit n'ayant pas encore choisi son rôle
}

export enum AvailabilityStatus {
  AVAILABLE = 'AVAILABLE', // Disponible
  BUSY = 'BUSY',           // Occupé
}

export enum PaymentType {
  PROVIDER_SUBSCRIPTION = 'PROVIDER_SUBSCRIPTION', // 5000 FCFA
  CLIENT_CONTACT_UNLOCK = 'CLIENT_CONTACT_UNLOCK',   // 1000 FCFA
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum RefundStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum PaymentMethod {
  MTN_MOMO = 'MTN_MOMO',
  ORANGE_MONEY = 'ORANGE_MONEY',
  MOOV_MONEY = 'MOOV_MONEY',
  WAVE = 'WAVE',
  AIRTEL_MONEY = 'AIRTEL_MONEY',
  MPESA = 'MPESA',
  FREE_TRIAL = 'FREE_TRIAL',
}
