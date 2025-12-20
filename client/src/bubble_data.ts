
import { BubbleItem } from './types';

export const BUBBLE_DATA: BubbleItem[] = [
  {
    id: 'music',
    label: '🎵 Concerts',
    color: 'from-pink-500 to-rose-500',
    depth: 0,
    children: [
      {
        id: 'rock',
        label: '🎸 Rock',
        color: 'from-red-400 to-orange-500',
        depth: 1,
        children: [
          { id: 'indie', label: 'Indie', color: 'from-red-300 to-red-400', depth: 2 },
          { id: 'metal', label: 'Metal', color: 'from-red-300 to-red-400', depth: 2 },
          { id: 'classic_rock', label: 'Classic', color: 'from-red-300 to-red-400', depth: 2 },
        ]
      },
      {
        id: 'electro',
        label: '🎧 Electro',
        color: 'from-blue-400 to-indigo-500',
        depth: 1,
        children: [
          { id: 'techno', label: 'Techno', color: 'from-blue-300 to-blue-400', depth: 2 },
          { id: 'house', label: 'House', color: 'from-blue-300 to-blue-400', depth: 2 },
          { id: 'lofi', label: 'Lo-Fi', color: 'from-blue-300 to-blue-400', depth: 2 },
        ]
      }
    ]
  },
  {
    id: 'outdoor',
    label: '🏔️ Trek & Nature',
    color: 'from-emerald-500 to-teal-500',
    depth: 0,
    children: [
      {
        id: 'sport',
        label: '🧗 Sport',
        color: 'from-green-400 to-emerald-500',
        depth: 1,
        children: [
          { id: 'climbing', label: 'Escalade', color: 'from-green-300 to-green-400', depth: 2 },
          { id: 'hiking', label: 'Rando', color: 'from-green-300 to-green-400', depth: 2 },
        ]
      },
      {
        id: 'zen',
        label: '🧘 Zen',
        color: 'from-emerald-300 to-teal-400',
        depth: 1,
        children: [
          { id: 'meditation', label: 'Méditation', color: 'from-emerald-200 to-emerald-300', depth: 2 },
          { id: 'yoga', label: 'Yoga', color: 'from-emerald-200 to-emerald-300', depth: 2 },
        ]
      }
    ]
  },
  {
    id: 'career',
    label: '💼 Product Management',
    color: 'from-sky-500 to-blue-600',
    depth: 0,
    children: [
      {
        id: 'tech',
        label: '💻 Tech',
        color: 'from-sky-400 to-sky-500',
        depth: 1,
        children: [
          { id: 'ai', label: 'IA', color: 'from-sky-300 to-sky-400', depth: 2 },
          { id: 'saas', label: 'SaaS', color: 'from-sky-300 to-sky-400', depth: 2 },
        ]
      },
      {
        id: 'design',
        label: '🎨 Design',
        color: 'from-purple-400 to-indigo-500',
        depth: 1,
        children: [
          { id: 'ux', label: 'UX/UI', color: 'from-purple-300 to-purple-400', depth: 2 },
          { id: 'brand', label: 'Branding', color: 'from-purple-300 to-purple-400', depth: 2 },
        ]
      }
    ]
  },
  {
    id: 'food',
    label: '🍕 Food & Drinks',
    color: 'from-orange-500 to-amber-600',
    depth: 0,
    children: [
      {
        id: 'cooking',
        label: '🍳 Cuisine',
        color: 'from-orange-400 to-orange-500',
        depth: 1,
        children: [
          { id: 'italian', label: 'Italien', color: 'from-orange-300 to-orange-400', depth: 2 },
          { id: 'asian', label: 'Asiatique', color: 'from-orange-300 to-orange-400', depth: 2 },
        ]
      },
      {
        id: 'spirits',
        label: '🍷 Vin & Cocktails',
        color: 'from-amber-400 to-amber-500',
        depth: 1,
        children: [
          { id: 'wine', label: 'Vin', color: 'from-amber-300 to-amber-400', depth: 2 },
          { id: 'mixology', label: 'Mixologie', color: 'from-amber-300 to-amber-400', depth: 2 },
        ]
      }
    ]
  }
];
