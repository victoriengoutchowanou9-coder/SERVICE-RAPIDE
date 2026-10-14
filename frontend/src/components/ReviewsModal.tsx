import React, { useState } from 'react';
import { Star, MessageSquare, X, CheckCircle2 } from 'lucide-react';
import { ProviderItem } from '../types';

interface ReviewsModalProps {
  provider: ProviderItem;
  onClose: () => void;
  onSubmitReview: (providerId: string, rating: number, comment: string) => void;
  canReview?: boolean;
}

export const ReviewsModal: React.FC<ReviewsModalProps> = ({
  provider,
  onClose,
  onSubmitReview,
  canReview = true,
}) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const reviewsList = provider.reviews || [
    {
      id: 'rev-1',
      clientName: 'Awa K.',
      rating: 5,
      comment: 'Intervention ultra rapide pour ma fuite d’eau à Cocody. Très poli, travail propre et tarif respecté.',
      date: 'Il y a 3 jours',
    },
    {
      id: 'rev-2',
      clientName: 'Michel D.',
      rating: 5,
      comment: 'Climatisation réparée en moins d’une heure. Je recommande sans hésiter !',
      date: 'La semaine dernière',
    },
    {
      id: 'rev-3',
      clientName: 'Fatou T.',
      rating: 4,
      comment: 'Bon travail, arrivé à l’heure convenue pour le rendez-vous programmé.',
      date: 'Il y a 2 semaines',
    },
  ];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    onSubmitReview(provider.id, rating, comment);
    setSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 my-auto animate-in fade-in zoom-in-95 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <img
              src={provider.photoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'}
              alt={provider.singleName}
              className="w-10 h-10 rounded-xl object-cover"
            />
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Avis & Notes sur {provider.singleName}
              </h3>
              <p className="text-[11px] text-slate-500">
                Note globale : <span className="font-bold text-amber-600">★ {provider.rating} / 5</span> ({provider.reviewsCount} avis)
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

        {/* Liste des avis clients */}
        <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
          {reviewsList.map((rev) => (
            <div
              key={rev.id}
              className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">{rev.clientName}</span>
                <span className="text-[10px] text-slate-400">{rev.date}</span>
              </div>
              <div className="flex items-center gap-0.5 text-amber-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3.5 h-3.5 ${
                      star <= rev.rating ? 'fill-current' : 'text-slate-200'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed italic">
                « {rev.comment} »
              </p>
            </div>
          ))}
        </div>

        {/* Formulaire pour noter le prestataire */}
        {canReview && (
          <div className="border-t border-slate-100 pt-3">
            {submitted ? (
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Merci ! Votre évaluation a été enregistrée.</span>
              </div>
            ) : (
              <form onSubmit={handleSend} className="space-y-3">
                <label className="block text-xs font-bold text-slate-800">
                  Noter ce prestataire après intervention
                </label>
                <div className="flex items-center gap-1 cursor-pointer">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 focus:outline-none"
                    >
                      <Star
                        className={`w-6 h-6 transition ${
                          star <= (hoverRating || rating)
                            ? 'text-amber-400 fill-current'
                            : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-600 ml-2">
                    {rating} / 5 étoiles
                  </span>
                </div>

                <textarea
                  rows={2}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Partagez votre avis (qualité du service, ponctualité, tarif respecté)..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none resize-none"
                />

                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs transition"
                >
                  Publier mon avis
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
