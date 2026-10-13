import React from 'react';
import { Users, Wifi, MapPin, Sparkles } from 'lucide-react';
import { ClientItem } from '../types';

export const CONNECTED_CLIENTS_DATA: ClientItem[] = [
  {
    id: 'cli-1',
    firstName: 'Awa',
    lastName: 'Kouassi',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    city: 'Abidjan (Cocody)',
    countryCode: 'CI',
    isOnline: true,
    lastActive: 'En ligne à l’instant',
    interests: 'Cherche : Climatisation, Électricité',
  },
  {
    id: 'cli-2',
    firstName: 'Ibrahim',
    lastName: 'Diallo',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    city: 'Dakar (Mermoz)',
    countryCode: 'SN',
    isOnline: true,
    lastActive: 'En ligne il y a 2 min',
    interests: 'Cherche : Plomberie urgente',
  },
  {
    id: 'cli-3',
    firstName: 'Clarisse',
    lastName: 'Gomez',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    city: 'Cotonou (Haie Vive)',
    countryCode: 'BJ',
    isOnline: true,
    lastActive: 'En ligne à l’instant',
    interests: 'Cherche : Menuiserie, Peinture',
  },
  {
    id: 'cli-4',
    firstName: 'Marc',
    lastName: 'Eto’o',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    city: 'Douala (Akwa)',
    countryCode: 'CM',
    isOnline: true,
    lastActive: 'En ligne il y a 5 min',
    interests: 'Cherche : Mécanique Auto',
  },
];

export const ConnectedClientsWidget: React.FC = () => {
  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900 leading-tight">
              Clients Connectés en Direct
            </h4>
            <p className="text-[10px] text-slate-400">
              Opportunités de mise en relation dans le fil d'actualité
            </p>
          </div>
        </div>
        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span>{CONNECTED_CLIENTS_DATA.length} actifs</span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {CONNECTED_CLIENTS_DATA.map((client) => (
          <div
            key={client.id}
            className="p-2.5 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-center gap-3 hover:bg-slate-100/60 transition"
          >
            <div className="relative">
              <img
                src={client.avatarUrl}
                alt={client.firstName}
                className="w-10 h-10 rounded-xl object-cover ring-2 ring-white shadow-xs"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-xs font-extrabold text-slate-900 truncate">
                  {client.firstName} {client.lastName?.charAt(0)}.
                </p>
                <span className="text-[9px] text-emerald-700 font-bold bg-emerald-100/60 px-1.5 py-0.5 rounded">
                  En ligne
                </span>
              </div>
              <p className="text-[10px] text-slate-500 flex items-center gap-1 truncate mt-0.5">
                <MapPin className="w-2.5 h-2.5 shrink-0 text-slate-400" />
                <span>{client.city}</span>
              </p>
              {client.interests && (
                <p className="text-[10px] text-brand-700 font-semibold truncate mt-0.5">
                  {client.interests}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
