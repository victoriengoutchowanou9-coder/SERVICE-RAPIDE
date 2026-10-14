import React, { useState } from 'react';
import {
  Zap,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  X,
  CreditCard,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { ProviderItem, ServiceRequest } from '../types';

interface BookingModalProps {
  provider: ProviderItem;
  client: any;
  onClose: () => void;
  onSubmitRequest: (request: Partial<ServiceRequest>) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  provider,
  client,
  onClose,
  onSubmitRequest,
}) => {
  // Modes : 'IMMEDIATE' (Maintenant) ou 'SCHEDULED' (Programmer)
  const [bookingMode, setBookingMode] = useState<'IMMEDIATE' | 'SCHEDULED'>('IMMEDIATE');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('10:00');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(client?.city || provider.city);
  const [paymentMethod, setPaymentMethod] = useState('ORANGE_MONEY');
  const [momoPhone, setMomoPhone] = useState(client?.phoneNumber || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Prix estimé = Tarif de base + frais de déplacement éventuels
  const travelFee = provider.travelRequired ? Number(provider.travelFee) || 0 : 0;
  const estimatedTotal = (Number(provider.basePrice) || 5000) + travelFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    if (bookingMode === 'SCHEDULED' && !scheduledDate) return;

    setLoading(true);

    const scheduledDateTime =
      bookingMode === 'SCHEDULED'
        ? `${scheduledDate} à ${scheduledTime}`
        : 'Intervention Immédiate (Moins de 45 min)';

    const newRequest: Partial<ServiceRequest> = {
      clientId: client?.id || 'client-demo',
      clientName: `${client?.firstName || 'Awa'} ${client?.lastName || 'Kouassi'}`.trim(),
      clientPhone: momoPhone || '+22507000000',
      clientAvatar: client?.avatarUrl,
      providerId: provider.id,
      providerSingleName: provider.singleName,
      serviceTitle: provider.serviceOffered,
      description,
      mode: bookingMode,
      scheduledDateTime,
      location,
      estimatedPrice: estimatedTotal,
      status: 'PENDING',
      paymentMethod,
    };

    setTimeout(() => {
      onSubmitRequest(newRequest);
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1800);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-auto animate-in fade-in zoom-in-95">
        <div className="flex items-start justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <img
              src={provider.photoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'}
              alt={provider.singleName}
              className="w-12 h-12 rounded-2xl object-cover ring-2 ring-brand-500/30"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-900">
                  Demande de service à {provider.singleName}
                </h3>
                <span className="text-[10px] font-bold bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">
                  ★ {provider.rating} ({provider.reviewsCount} avis)
                </span>
              </div>
              <p className="text-xs text-brand-600 font-bold mt-0.5">
                {provider.serviceOffered}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-6 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 text-brand-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-black text-slate-900">
              Demande envoyée avec succès !
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {provider.singleName} a été notifié de votre besoin ({bookingMode === 'IMMEDIATE' ? 'Urgence immédiate' : 'Service programmé'}). Vous recevrez une réponse sous peu.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. CHOIX DU MODE : SERVICE IMMÉDIAT OU PROGRAMMÉ */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Délai d'intervention souhaité *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* Mode Maintenant */}
                <button
                  type="button"
                  onClick={() => setBookingMode('IMMEDIATE')}
                  className={`p-3 rounded-2xl border-2 text-left transition flex items-center gap-2.5 ${
                    bookingMode === 'IMMEDIATE'
                      ? 'border-brand-600 bg-emerald-50/70 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      bookingMode === 'IMMEDIATE'
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Zap className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <span className="block text-xs font-black text-slate-900 leading-tight">
                      Maintenant
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">
                      Urgence immédiate
                    </span>
                  </div>
                </button>

                {/* Mode Programmer */}
                <button
                  type="button"
                  onClick={() => setBookingMode('SCHEDULED')}
                  className={`p-3 rounded-2xl border-2 text-left transition flex items-center gap-2.5 ${
                    bookingMode === 'SCHEDULED'
                      ? 'border-brand-600 bg-emerald-50/70 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      bookingMode === 'SCHEDULED'
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-black text-slate-900 leading-tight">
                      Programmer
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">
                      Date & heure au choix
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Date et Heure si Programmation */}
            {bookingMode === 'SCHEDULED' && (
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 gap-3 animate-in fade-in duration-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Date du rendez-vous *
                  </label>
                  <input
                    type="date"
                    required
                    value={scheduledDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Heure prévue *
                  </label>
                  <input
                    type="time"
                    required
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            )}

            {/* Description du besoin */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Description de votre problème / mission *
              </label>
              <textarea
                rows={2}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Fuite d'eau sous l'évier de la cuisine, panne de climatiseur split, disjoncteur qui saute..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none resize-none"
              />
            </div>

            {/* Lieu d'intervention */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>Adresse / Quartier d'intervention *</span>
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Cocody Angré 8ème tranche, Cotonou Haie Vive..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Estimation du Tarif et Paiement Mobile Money */}
            <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    Estimation du Prix
                  </span>
                  <div className="text-base font-black text-emerald-950">
                    {estimatedTotal.toLocaleString()} FCFA
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-600 font-medium">
                  <div>Base : {provider.basePrice?.toLocaleString()} FCFA</div>
                  {travelFee > 0 && <div>Déplacement : +{travelFee.toLocaleString()} FCFA</div>}
                </div>
              </div>

              <div className="border-t border-emerald-200/80 pt-2.5 space-y-2">
                <label className="block text-[11px] font-bold text-slate-800 flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Mode de règlement Mobile Money prévu</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold"
                  >
                    <option value="ORANGE_MONEY">Orange Money</option>
                    <option value="MTN_MOMO">MTN MoMo</option>
                    <option value="MOOV_MONEY">Moov Money</option>
                    <option value="WAVE">Wave (0% frais)</option>
                  </select>

                  <input
                    type="tel"
                    placeholder="N° Mobile Money"
                    value={momoPhone}
                    onChange={(e) => setMomoPhone(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-black py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition shadow-md shadow-brand-500/20 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Envoi en cours...</span>
              ) : bookingMode === 'IMMEDIATE' ? (
                <>
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Demander l'intervention Maintenant</span>
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  <span>Confirmer la Programmation</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
