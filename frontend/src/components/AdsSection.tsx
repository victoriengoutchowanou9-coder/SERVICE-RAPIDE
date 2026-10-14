import React, { useState } from 'react';
import { Sparkles, ExternalLink, Megaphone } from 'lucide-react';
import { AdItem } from '../types';

export const ADS_DATA: AdItem[] = [
  {
    id: 'ad-1',
    title: 'Outillage Pro Bosch & Total Afrique',
    content: 'Jusqu’à -25% sur perceuses, meuleuses et groupes électrogènes livrés dans 15 capitales africaines.',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    advertiser: 'Bosch Professional Afrique',
    tag: 'Sponsorisé • Outillage',
    targetUrl: 'https://example.com/bosch-promo',
  },
  {
    id: 'ad-2',
    title: 'Wave & Orange Money : Encaissez vos clients instantanément',
    content: '0% de frais sur vos 10 premiers encaissements de prestations avec le compte Pro.',
    imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80',
    advertiser: 'Mobile Money Pro',
    tag: 'Sponsorisé • Finance',
    targetUrl: 'https://example.com/momo-promo',
  },
  {
    id: 'ad-3',
    title: 'Assurance Sanlam Intervention Chantier & Atelier',
    content: 'Protégez votre travail et couvrez vos clients en cas d’accident technique dès 2 000 FCFA/mois.',
    imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80',
    advertiser: 'Sanlam Assurance',
    tag: 'Sponsorisé • Protection',
    targetUrl: 'https://example.com/sanlam-promo',
  },
];

export const AdsSection: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [ads, setAds] = useState<AdItem[]>(ADS_DATA);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newAdvertiser, setNewAdvertiser] = useState('');
  const [newTargetUrl, setNewTargetUrl] = useState('');
  const [newTag, setNewTag] = useState('Offre Spéciale');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);

  const handleCreateAd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const newAd: AdItem = {
      id: `ad-${Date.now()}`,
      title: newTitle,
      content: newContent,
      advertiser: newAdvertiser || 'Annonceur Partenaire',
      tag: `Sponsorisé • ${newTag}`,
      targetUrl: newTargetUrl || '#',
      imageUrl:
        newImageUrl ||
        'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80',
    };

    setAds([newAd, ...ads]);
    setSuccessMsg(true);
    setTimeout(() => {
      setSuccessMsg(false);
      setShowCreateModal(false);
      setNewTitle('');
      setNewContent('');
      setNewAdvertiser('');
      setNewTargetUrl('');
    }, 1500);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-wider">
          <Megaphone className="w-4 h-4 text-amber-500" />
          <span>Espace Publicités & Partenaires Panafricains</span>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5 transition"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>+ Faire une publicité</span>
        </button>
      </div>

      <div className={`grid gap-3 ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
        {ads.map((ad) => (
          <div
            key={ad.id}
            className="group relative bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              {ad.imageUrl && (
                <div className="relative h-28 w-full overflow-hidden bg-slate-100">
                  <img
                    src={ad.imageUrl}
                    alt={ad.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                    <span>{ad.tag}</span>
                  </div>
                </div>
              )}
              <div className="p-3">
                <p className="text-[10px] font-bold text-slate-400">{ad.advertiser}</p>
                <h4 className="text-xs font-black text-slate-900 line-clamp-1 mt-0.5 group-hover:text-brand-600 transition">
                  {ad.title}
                </h4>
                <p className="text-[11px] text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                  {ad.content}
                </p>
              </div>
            </div>

            <div className="px-3 pb-3 pt-1">
              <a
                href={ad.targetUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-50 hover:bg-brand-50 text-slate-700 hover:text-brand-700 text-[11px] font-bold border border-slate-200 transition"
              >
                <span>En savoir plus</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Créer une publicité */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 my-auto animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Publier une annonce publicitaire</h3>
                  <p className="text-[11px] text-slate-500">Diffusez auprès de milliers de clients en Afrique</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1"
              >
                ✕
              </button>
            </div>

            {successMsg ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1">
                <p className="text-xs font-bold text-emerald-800">🎉 Votre publicité a été publiée avec succès !</p>
                <p className="text-[11px] text-emerald-600">Elle est maintenant visible par tous les utilisateurs.</p>
              </div>
            ) : (
              <form onSubmit={handleCreateAd} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nom de votre entreprise ou marque *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Quincaillerie Moderne, Boutique Aïcha..."
                    value={newAdvertiser}
                    onChange={(e) => setNewAdvertiser(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Titre accrocheur de la publicité *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Promotion -30% sur tous les climatiseurs"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Catégorie / Tag
                  </label>
                  <select
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                  >
                    <option value="Offre Spéciale">Offre Spéciale</option>
                    <option value="Outillage & Équipement">Outillage & Équipement</option>
                    <option value="Finance & Mobile Money">Finance & Mobile Money</option>
                    <option value="Assurance & Sécurité">Assurance & Sécurité</option>
                    <option value="Véhicules & Transport">Véhicules & Transport</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Description détaillée de votre offre *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Présentez votre produit ou promotion en quelques lignes..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Lien vers votre site web ou WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="https://mon-site.com ou https://wa.me/22507..."
                    value={newTargetUrl}
                    onChange={(e) => setNewTargetUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Image d'illustration (URL)
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md transition"
                  >
                    Diffuser la publicité
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
