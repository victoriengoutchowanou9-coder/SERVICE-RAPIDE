import React, { useState } from 'react';
import {
  LifeBuoy,
  MessageCircle,
  Phone,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export const SupportModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [subject, setSubject] = useState('Problème avec une prestation');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  // Coordonnées officielles du support client Service Rapide
  const WHATSAPP_NUMBER = '+22955445122';
  const WHATSAPP_LINK = 'https://wa.me/22955445122?text=Bonjour%20Support%20Service%20Rapide,%20j%27ai%20besoin%20d%27assistance.';
  const PHONE_NUMBER = '+2290155445122';
  const PHONE_CALL_LINK = 'tel:+2290155445122';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSent(true);
    setTimeout(() => {
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 my-auto animate-in fade-in zoom-in-95 space-y-4">
        {/* En-tête */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900">Support Client Service Rapide</h3>
              <p className="text-[11px] text-slate-500">Assistance 24/7 et résolution des litiges</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm transition"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Canaux officiels directs : WhatsApp et Appel Téléphonique */}
        <div className="space-y-2.5">
          <p className="text-xs font-black uppercase tracking-wider text-slate-700">
            Coordonnées Officielles d'Assistance Directe
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Bouton WhatsApp */}
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noreferrer"
              className="p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-200 text-emerald-900 transition flex flex-col justify-between shadow-2xs group"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-black block group-hover:text-emerald-700">WhatsApp Support</span>
                  <span className="text-[10px] text-emerald-700 font-semibold">Réponse rapide</span>
                </div>
              </div>
              <div className="pt-1 border-t border-emerald-200/60 mt-1">
                <span className="text-xs font-black text-emerald-950 block">{WHATSAPP_NUMBER}</span>
                <span className="text-[10px] text-emerald-700 underline font-bold mt-0.5 inline-block">
                  Contacter le support sur WhatsApp →
                </span>
              </div>
            </a>

            {/* Bouton Appel téléphonique direct */}
            <a
              href={PHONE_CALL_LINK}
              className="p-3.5 rounded-2xl bg-blue-50 hover:bg-blue-100/90 border border-blue-200 text-blue-900 transition flex flex-col justify-between shadow-2xs group"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-black block group-hover:text-blue-700">Ligne Téléphonique</span>
                  <span className="text-[10px] text-blue-700 font-semibold">Appel direct</span>
                </div>
              </div>
              <div className="pt-1 border-t border-blue-200/60 mt-1">
                <span className="text-xs font-black text-blue-950 block">{PHONE_NUMBER}</span>
                <span className="text-[10px] text-blue-700 underline font-bold mt-0.5 inline-block">
                  Appeler le support →
                </span>
              </div>
            </a>
          </div>
        </div>

        {/* Message de confirmation ou formulaire écrit */}
        {sent ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1.5 animate-in fade-in">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="text-xs font-black text-emerald-900">
              Message d'assistance transmis avec succès !
            </p>
            <p className="text-[11px] text-emerald-700">
              Un agent du support client vous contactera sans délai.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 pt-1 border-t border-slate-100">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Motif de votre demande écrite
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none"
              >
                <option value="Problème avec une prestation">Problème avec une prestation</option>
                <option value="Question sur le paiement Mobile Money">Paiement Mobile Money / Reçu</option>
                <option value="Demande de remboursement urgent">Demande de remboursement urgent</option>
                <option value="Signalement ou assistance technique">Signalement ou assistance technique</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Détail de votre situation
              </label>
              <textarea
                required
                rows={3}
                placeholder="Expliquez brièvement votre demande..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Fermer
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-black text-xs shadow-xs transition"
              >
                Envoyer le message
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
