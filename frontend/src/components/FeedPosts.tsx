import React, { useState } from 'react';
import {
  Send,
  Image as ImageIcon,
  Heart,
  Share2,
  MapPin,
  Sparkles,
  MessageCircle,
} from 'lucide-react';
import { PostItem } from '../types';

interface FeedPostsProps {
  userRole: 'CLIENT' | 'PROVIDER' | 'ADMIN';
  currentUser: any;
  posts: PostItem[];
  onAddPost: (post: Partial<PostItem>) => void;
}

export const FeedPosts: React.FC<FeedPostsProps> = ({
  userRole,
  currentUser,
  posts,
  onAddPost,
}) => {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImgInput, setShowImgInput] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});

  const isProvider = userRole === 'PROVIDER';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    onAddPost({
      content,
      imageUrl: imageUrl.trim() || undefined,
      authorId: currentUser?.id || 'demo-provider',
      authorSingleName:
        currentUser?.providerProfile?.singleName || currentUser?.firstName || 'Prestataire',
      authorPhotoUrl:
        currentUser?.providerProfile?.photoUrl ||
        currentUser?.avatarUrl ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      authorService: currentUser?.providerProfile?.serviceOffered || 'Prestation Spécialisée',
      city: currentUser?.providerProfile?.city || 'Abidjan',
      department: currentUser?.providerProfile?.department || 'Cocody',
      mapLocationHint: `Zone ${currentUser?.providerProfile?.department || 'Riviera'} • Disponible`,
    });

    setContent('');
    setImageUrl('');
    setShowImgInput(false);
  };

  const toggleLike = (id: string) => {
    setLikedPosts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-4">
      {/* SECTION PUBLICATION (Accessible aux Prestataires pour valoriser leurs réalisations) */}
      {isProvider && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3"
        >
          <div className="flex items-start gap-3">
            <img
              src={
                currentUser?.providerProfile?.photoUrl ||
                currentUser?.avatarUrl ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
              }
              alt="Profil"
              className="w-10 h-10 rounded-2xl object-cover ring-2 ring-brand-500/30 shrink-0"
            />
            <div className="flex-1">
              <textarea
                rows={2}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Partagez une réalisation, une disponibilité ou une astuce technique avec les clients..."
                className="w-full text-xs font-medium placeholder-slate-400 bg-slate-50 border border-slate-200 rounded-2xl p-3 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none transition resize-none"
              />
            </div>
          </div>

          {showImgInput && (
            <div className="pl-13">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Collez l'URL de votre photo de réalisation (ex: https://...)"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium focus:bg-white focus:ring-2 focus:ring-brand-500"
              />
            </div>
          )}

          <div className="flex items-center justify-between pl-13 pt-1">
            <button
              type="button"
              onClick={() => setShowImgInput(!showImgInput)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-600 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-xl transition"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{showImgInput ? 'Masquer photo' : 'Ajouter une photo'}</span>
            </button>

            <button
              type="submit"
              disabled={!content.trim()}
              className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Publier</span>
            </button>
          </div>
        </form>
      )}

      {/* FIL DES PUBLICATIONS */}
      <div className="space-y-4">
        {posts.map((post) => {
          const isLiked = likedPosts[post.id];
          const displayLikes = post.likesCount + (isLiked ? 1 : 0);

          return (
            <article
              key={post.id}
              className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-3"
            >
              {/* En-tête de la publication */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={
                      post.authorPhotoUrl ||
                      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
                    }
                    alt={post.authorSingleName}
                    className="w-10 h-10 rounded-2xl object-cover ring-2 ring-emerald-500/20"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-black text-slate-900">
                        {post.authorSingleName}
                      </h4>
                      <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md">
                        {post.authorService}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                      {/* LOCALISATION VISIBLE PAR LES CLIENTS DANS LE FIL D'ACTUALITÉ */}
                      <span className="inline-flex items-center gap-1 font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                        <MapPin className="w-3 h-3 text-brand-600 shrink-0" />
                        <span>
                          {post.city}
                          {post.department ? `, ${post.department}` : ''}
                        </span>
                      </span>
                      {post.mapLocationHint && (
                        <span className="inline-flex items-center text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                          📍 {post.mapLocationHint}
                        </span>
                      )}
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-400 font-medium">{post.createdAt}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Texte */}
              <p className="text-xs text-slate-700 font-medium leading-relaxed">
                {post.content}
              </p>

              {/* Image d'illustration si présente */}
              {post.imageUrl && (
                <div className="rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 max-h-72">
                  <img
                    src={post.imageUrl}
                    alt="Réalisation"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Actions d'interaction */}
              <div className="flex items-center gap-4 pt-2 border-t border-slate-100">
                <button
                  onClick={() => toggleLike(post.id)}
                  className={`flex items-center gap-1.5 text-xs font-bold transition ${
                    isLiked
                      ? 'text-rose-600'
                      : 'text-slate-500 hover:text-rose-600'
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`}
                  />
                  <span>{displayLikes}</span>
                </button>

                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                  <MessageCircle className="w-4 h-4" />
                  <span>Discussion</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
