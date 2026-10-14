import React, { useState } from 'react';
import {
  LifeBuoy,
  MessageCircle,
  Phone,
  Mail,
  Send,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  FileQuestion,
} from 'lucide-react';

export const SupportModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [subject, setSubject] = useState('Problème avec une prestation');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSent(true);
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 my-auto animate-in fade-in zoom-in-95 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Support Client & Litiges</h3>
              <p className="text-[11px] text-slate-500">Assistance 24/7 pour toute l'Afrique</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
          >
            ✕
          </button>
        </div>

        {/* Canaux directs d'urgence */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <a
            href="https://wa.me/2250700000000?text=Bonjour%20Support%20Service%20Rapide"
            target="_blank"
            rel="noreferrer"
            className="p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-800 font-bold flex flex-col items-center justify-center gap-1.5 transition text-center"
          >
            <MessageCircle className="w-5 h-5 text-emerald-600" />
            <span>WhatsApp Direct</span>
          </a>
          <a
            href="tel:+2250700000000"
            className="p-3 rounded-2xl bg-blue-50 hover:bg-blue-100/80 border border-blue-200 text-blue-800 font-bold flex flex-col items-center justify-center gap-1.5 transition text-center"
          >
            <Phone className="w-5 h-5 text-blue-600" />
            <span>Ligne Téléphonique</span>
          </a>
        </div>

        {sent ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="text-xs font-bold text-emerald-900">
              Message envoyé à notre équipe support !
            </p>
            <p className="text-[11px] text-emerald-700">
              Un conseiller vous répondra par email ou WhatsApp dans les plus brefs délais.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Motif de votre demande
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
              >
                <option value="Problème avec une prestation">Problème avec une prestation</option>
                <option value="Question sur le paiement Mobile Money">Paiement Mobile Money / Reçu</option>
                <option value="Demande de remboursement urgent">Demande de remboursement urgent</option>
                <option value="Autre question">Autre question ou suggestion</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Expliquez votre situation
              </label>
              <textarea
                rows={3}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Indiquez les détails de votre problème..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Envoyer ma réclamation</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
