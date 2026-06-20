import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  limit
} from 'firebase/firestore';
import { 
  MessageSquare, 
  Heart, 
  Send, 
  Search, 
  PlusCircle, 
  Megaphone, 
  Calendar, 
  HelpCircle, 
  Sparkles, 
  Share2, 
  Trash2,
  Users2,
  Building,
  Pin,
  X,
  Plus
} from 'lucide-react';
import { CommunityPost, CommunityComment, Hotel } from '../types';

interface SinergiaCommunityPanelProps {
  currentHotelId: string;
  hotels: Hotel[];
  activeUserProfile: any;
}

type CategoryType = 'all' | 'announcement' | 'event' | 'alliance' | 'help' | 'general';

export default function SinergiaCommunityPanel({ 
  currentHotelId, 
  hotels, 
  activeUserProfile 
}: SinergiaCommunityPanelProps) {
  // Active hotel object
  const activeHotel = hotels.find(h => h.id === currentHotelId) || hotels[0];

  // States
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('all');
  const [isFirebaseLoading, setIsFirebaseLoading] = useState(true);

  // New post composer states
  const [showComposer, setShowComposer] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<'announcement' | 'event' | 'alliance' | 'help' | 'general'>('general');
  const [postingLoader, setPostingLoader] = useState(false);

  // Comments states
  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState<string | null>(null);
  const [newCommentTexts, setNewCommentTexts] = useState<{ [postId: string]: string }>({});
  const [commentingLoader, setCommentingLoader] = useState<{ [postId: string]: boolean }>({});

  // 1. Listen to community posts from Firestore in Real-Time
  useEffect(() => {
    setIsFirebaseLoading(true);
    const postsQuery = query(
      collection(db, 'communityPosts'), 
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const loadedPosts: CommunityPost[] = [];
      snapshot.forEach((doc) => {
        loadedPosts.push({ id: doc.id, ...doc.data() } as CommunityPost);
      });
      setPosts(loadedPosts);
      setIsFirebaseLoading(false);
    }, (error) => {
      console.error("Error listening to community posts:", error);
      setIsFirebaseLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Listen to comments on snapshot from Firestore in Real-Time
  useEffect(() => {
    const commentsQuery = query(
      collection(db, 'communityComments'), 
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      const loadedComments: CommunityComment[] = [];
      snapshot.forEach((doc) => {
        loadedComments.push({ id: doc.id, ...doc.data() } as CommunityComment);
      });
      setComments(loadedComments);
    }, (error) => {
      console.error("Error listening to community comments:", error);
    });

    return () => unsubscribe();
  }, []);

  // Handle New Post Submission
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setPostingLoader(true);
    try {
      const postPayload: Omit<CommunityPost, 'id'> = {
        hotelId: activeHotel.id,
        hotelName: activeHotel.name,
        hotelType: activeHotel.type || 'Hotel',
        category: newCategory,
        title: newTitle.trim(),
        content: newContent.trim(),
        likes: [],
        commentsCount: 0,
        createdAt: new Date().toISOString(),
        authorName: activeUserProfile.name || 'Personal Sinergia',
        authorRole: activeUserProfile.roleLabel || 'Personal Autorizado'
      };

      await addDoc(collection(db, 'communityPosts'), postPayload);
      
      // Reset state
      setNewTitle('');
      setNewContent('');
      setNewCategory('general');
      setShowComposer(false);
    } catch (err) {
      console.error("Error adding post: ", err);
    } finally {
      setPostingLoader(false);
    }
  };

  // Handle Like/Unlike Post
  const handleLikePost = async (postId: string, currentLikes: string[]) => {
    const isLiked = currentLikes.includes(activeHotel.id);
    const postRef = doc(db, 'communityPosts', postId);

    try {
      await updateDoc(postRef, {
        likes: isLiked 
          ? arrayRemove(activeHotel.id) 
          : arrayUnion(activeHotel.id)
      });
    } catch (err) {
      console.error("Error toggling like: ", err);
    }
  };

  // Handle Comment Submission
  const handleAddComment = async (postId: string) => {
    const txt = newCommentTexts[postId] || '';
    if (!txt.trim()) return;

    setCommentingLoader(prev => ({ ...prev, [postId]: true }));
    try {
      const commentPayload: Omit<CommunityComment, 'id'> = {
        postId,
        hotelId: activeHotel.id,
        hotelName: activeHotel.name,
        hotelType: activeHotel.type || 'Hotel',
        authorName: activeUserProfile.name || 'Personal Sinergia',
        authorRole: activeUserProfile.roleLabel || 'Colaborador',
        content: txt.trim(),
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'communityComments'), commentPayload);

      // Update comment count on post
      const postRef = doc(db, 'communityPosts', postId);
      const targetPost = posts.find(p => p.id === postId);
      if (targetPost) {
        await updateDoc(postRef, {
          commentsCount: (targetPost.commentsCount || 0) + 1
        });
      }

      // Clear comment input info
      setNewCommentTexts(prev => ({ ...prev, [postId]: '' }));
    } catch (err) {
      console.error("Error posting comment: ", err);
    } finally {
      setCommentingLoader(prev => ({ ...prev, [postId]: false }));
    }
  };

  // Handle Delete Post (Only if post belongs to current hotel OR active user is global admin)
  const handleDeletePost = async (postId: string, postHotelId: string) => {
    const canDelete = postHotelId === activeHotel.id || activeUserProfile.role === 'admin';
    if (!canDelete) return;

    if (window.confirm('¿Seguro que deseas eliminar esta publicación permanentemente?')) {
      try {
        await deleteDoc(doc(db, 'communityPosts', postId));
        // Also delete related comments
        const relatedComments = comments.filter(c => c.postId === postId);
        for (const comment of relatedComments) {
          await deleteDoc(doc(db, 'communityComments', comment.id));
        }
      } catch (err) {
        console.error("Error deleting post: ", err);
      }
    }
  };

  // Helper formatting dates in relative terms
  const formatRelativeTime = (isoString: string) => {
    try {
      const past = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - past.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'Hace un momento';
      if (diffMins < 60) return `Hace ${diffMins} min`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
      
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Ayer';
      if (diffDays < 7) return `Hace ${diffDays} días`;
      
      return past.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
    } catch (e) {
      return '';
    }
  };

  // Extract category configs (color, labels, icon)
  const getCategoryConfig = (category: string) => {
    switch (category) {
      case 'announcement': 
        return { 
          badge: 'bg-rose-50 text-rose-700 border-rose-100', 
          label: 'Anuncio Oficial', 
          icon: <Megaphone className="w-3.5 h-3.5" /> 
        };
      case 'event': 
        return { 
          badge: 'bg-violet-50 text-violet-700 border-violet-100', 
          label: 'Evento / Encuentro', 
          icon: <Calendar className="w-3.5 h-3.5" /> 
        };
      case 'alliance': 
        return { 
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-100', 
          label: 'Alianza o Beneficio', 
          icon: <Sparkles className="w-3.5 h-3.5" /> 
        };
      case 'help': 
        return { 
          badge: 'bg-amber-50 text-amber-700 border-amber-100', 
          label: 'Soporte / Pregunta', 
          icon: <HelpCircle className="w-3.5 h-3.5" /> 
        };
      default: 
        return { 
          badge: 'bg-slate-50 text-slate-700 border-slate-100', 
          label: 'General', 
          icon: <Users2 className="w-3.5 h-3.5" /> 
        };
    }
  };

  // Filter posts
  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          post.hotelName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Banner de Sinergia Community Hub */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-15 pointer-events-none translate-x-12 translate-y-4">
          <Building className="w-64 h-64 text-indigo-400" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-indigo-500/25 border border-indigo-400/30 text-indigo-300 text-[10px] font-mono font-bold tracking-widest px-2 py-0.5 rounded-full uppercase leading-none">
                Módulo Sinergia-Social
              </span>
              <span className="bg-emerald-500/25 border border-emerald-400/30 text-emerald-300 text-[10px] font-mono font-black tracking-widest px-2 py-0.5 rounded-full uppercase leading-none animate-pulse">
                ✓ Sincronizado En Tiempo Real
              </span>
            </div>
            
            <h1 className="text-xl md:text-2xl font-bold font-sans tracking-tight text-white flex items-center gap-2">
              <Users2 className="w-6 h-6 text-indigo-400" /> Community Portal Sinergia
            </h1>
            <p className="text-xs text-slate-350 max-w-xl mt-1 leading-relaxed">
              Mantente al día, organiza eventos colaborativos, ofrece alianzas comerciales o intercambia insumos y personal con otros hospedajes de la red.
            </p>
          </div>

          <button
            onClick={() => setShowComposer(!showComposer)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 flex items-center gap-1.5 self-stretch md:self-auto justify-center cursor-pointer"
          >
            {showComposer ? (
              <>
                <X className="w-4 h-4" /> Cancelar Redacción
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Publicar en la Red
              </>
            )}
          </button>
        </div>
      </div>

      {/* Formulario de Nueva Publicación (Collapsible Composer) */}
      {showComposer && (
        <div className="bg-white border border-indigo-100 rounded-2xl p-5 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex items-center gap-2 border-b border-indigo-50/70 pb-3">
            <span className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
              <PlusCircle className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider font-mono">Redactar Mensaje Colaborativo</h3>
              <p className="text-[10px] text-slate-500 leading-none">Tu mensaje será visible para todo el personal administrativo afiliado a Sinergia-SaaS.</p>
            </div>
          </div>

          <form onSubmit={handleCreatePost} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Categoría */}
              <div className="space-y-1 md:col-span-1">
                <label className="text-[9.5px] text-slate-500 font-bold uppercase font-mono block">Canal / Compartimiento</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 focus:border-indigo-400 rounded-xl p-2.5 text-xs text-slate-700 font-medium"
                >
                  <option value="general">💬 General / Conversación</option>
                  <option value="announcement">🔊 Anuncio Oficial Inter-Hoteles</option>
                  <option value="event">📅 Eventos de Capacitación o Alianzas</option>
                  <option value="alliance">🤝 Convenios, Ofertas y Tarifas Net</option>
                  <option value="help">🆘 Pedido de Insumos o Soporte</option>
                </select>
              </div>

              {/* Título */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-[9.5px] text-slate-500 font-bold uppercase font-mono block">Título de la Publicación</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: ¿Unificación de Compras de Amenidades de Lujo en Villa de Leyva?"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-indigo-400 rounded-xl p-2.5 text-xs text-slate-800 font-semibold"
                />
              </div>
            </div>

            {/* Content */}
            <div className="space-y-1">
              <label className="text-[9.5px] text-slate-500 font-bold uppercase font-mono block">Cuerpo del Mensaje</label>
              <textarea
                required
                rows={4}
                placeholder="Describe tu propuesta, consulta o aviso con todo detalle. Especifica datos de contacto opcionales para concretar la colaboración..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="w-full bg-white border border-slate-200 focus:border-indigo-400 rounded-xl p-3 text-xs text-slate-700 leading-relaxed outline-hidden"
              />
            </div>

            <div className="bg-slate-50 rounded-xl p-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></div>
                <span className="text-[10px] text-slate-500 font-medium">Publicando como <strong className="text-slate-700 font-bold">{activeUserProfile.name}</strong> ({activeHotel.name})</span>
              </div>

              <button
                type="submit"
                disabled={postingLoader}
                className="bg-[#0B523A] hover:bg-[#073c2a] text-white font-bold text-xs px-5 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {postingLoader ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/60 border-t-transparent rounded-full animate-spin"></div>
                    Publicando...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> Enviar Publicación
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Pestañas de categorías */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar w-full md:w-auto p-1 bg-slate-100/70 rounded-xl select-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
              selectedCategory === 'all' 
                ? 'bg-white text-indigo-950 shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📋 Todos
          </button>
          <button
            onClick={() => setSelectedCategory('announcement')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
              selectedCategory === 'announcement' 
                ? 'bg-rose-550 text-white shadow-xs' 
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            🔊 Anuncios
          </button>
          <button
            onClick={() => setSelectedCategory('event')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
              selectedCategory === 'event' 
                ? 'bg-violet-650 text-white shadow-xs' 
                : 'text-violet-700 hover:bg-violet-50'
            }`}
          >
            📅 Eventos
          </button>
          <button
            onClick={() => setSelectedCategory('alliance')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
              selectedCategory === 'alliance' 
                ? 'bg-emerald-650 text-white shadow-xs' 
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            🤝 Alianzas
          </button>
          <button
            onClick={() => setSelectedCategory('help')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
              selectedCategory === 'help' 
                ? 'bg-amber-600 text-white shadow-xs' 
                : 'text-amber-800 hover:bg-amber-50'
            }`}
          >
            🆘 Soporte
          </button>
          <button
            onClick={() => setSelectedCategory('general')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
              selectedCategory === 'general' 
                ? 'bg-slate-750 text-white shadow-xs' 
                : 'text-slate-650 hover:bg-slate-50'
            }`}
          >
            💬 General
          </button>
        </div>

        {/* Búsqueda */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por hotel o palabra clave..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-205 focus:border-indigo-400 focus:bg-white rounded-xl py-2 pl-9 pr-4 text-xs select-none"
          />
        </div>
      </div>

      {/* Feed de Publicaciones */}
      {isFirebaseLoading ? (
        <div className="bg-white border border-slate-150 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-650 rounded-full animate-spin mb-4"></div>
          <p className="text-xs text-slate-500 font-bold font-mono uppercase tracking-wider">Conectando con el Servidor Sinergia IA...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="bg-white border border-slate-150 rounded-2xl p-12 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <Search className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-800">No se encontraron publicaciones</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            Parece que no hay publicaciones en esta categoría que coincidan con tus términos de selección de búsqueda. ¡Crea el primero usando el botón de arriba!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => {
            const hasLiked = post.likes?.includes(activeHotel.id) || false;
            const categoryConfig = getCategoryConfig(post.category);
            const isAuthor = post.hotelId === activeHotel.id;
            const isGlobalAdmin = activeUserProfile.role === 'admin';

            // Filter comments for this post
            const postComments = comments.filter(c => c.postId === post.id);

            return (
              <div 
                key={post.id} 
                className="bg-white border border-slate-150 rounded-2xl shadow-xs overflow-hidden transition-all hover:border-slate-300"
              >
                {/* Header Info */}
                <div className="p-4 sm:p-5 flex items-start gap-3.5 border-b border-slate-50">
                  {/* Decorative Initials-based icon container */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ring-2 ring-slate-100 shrink-0 ${
                    post.category === 'announcement' ? 'bg-rose-100 text-rose-700' :
                    post.category === 'event' ? 'bg-violet-100 text-violet-700' :
                    post.category === 'alliance' ? 'bg-emerald-100 text-emerald-700' :
                    post.category === 'help' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {post.hotelName.substring(0, 2).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-xs font-black text-slate-800 truncate leading-none">
                        {post.hotelName}
                      </span>
                      <span className="text-[9px] bg-slate-100 text-slate-500 border border-slate-200/60 rounded-md px-1.5 py-0.5 font-bold uppercase tracking-wider leading-none">
                        {post.hotelType}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[10px] text-slate-500 font-medium">
                        Publicado por <strong className="text-slate-700 font-bold">{post.authorName}</strong> ({post.authorRole})
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[10px] text-slate-400 font-mono font-bold whitespace-nowrap">
                        {formatRelativeTime(post.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Right Side Category Badge */}
                  <div className="flex flex-col items-end gap-1.5">
                    <div className={`text-[9.5px] font-black border rounded-full px-2 py-0.5 flex items-center gap-1 ${categoryConfig.badge}`}>
                      {categoryConfig.icon}
                      {categoryConfig.label}
                    </div>

                    {(isAuthor || isGlobalAdmin) && (
                      <button
                        onClick={() => handleDeletePost(post.id, post.hotelId)}
                        className="text-slate-405 hover:text-rose-600 transition-all p-1 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="Eliminar publicación"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-4 sm:p-5 space-y-3">
                  <h2 className="text-sm font-black text-slate-850 tracking-tight leading-snug">
                    {post.title}
                  </h2>
                  <p className="text-xs text-slate-650 leading-relaxed font-sans whitespace-pre-wrap">
                    {post.content}
                  </p>
                </div>

                {/* Actions Row */}
                <div className="bg-slate-50/70 p-3 sm:px-5 flex items-center justify-between border-t border-slate-100 text-xs font-semibold select-none">
                  <div className="flex items-center gap-4">
                    {/* Like button */}
                    <button
                      onClick={() => handleLikePost(post.id, post.likes || [])}
                      className={`flex items-center gap-1.5 px-2.5 py-1.2 rounded-lg transition-all cursor-pointer ${
                        hasLiked 
                          ? 'bg-rose-50 text-rose-600' 
                          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-850'
                      }`}
                    >
                      <Heart className={`w-4 h-4 transition-transform active:scale-130 ${hasLiked ? 'fill-rose-600 text-rose-600' : ''}`} />
                      <span>{post.likes?.length || 0}</span>
                    </button>

                    {/* Comment button toggler */}
                    <button
                      onClick={() => setExpandedCommentsPostId(expandedCommentsPostId === post.id ? null : post.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.2 rounded-lg transition-all cursor-pointer ${
                        expandedCommentsPostId === post.id 
                          ? 'bg-indigo-50 text-indigo-700' 
                          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-850'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>{postComments.length} {postComments.length === 1 ? 'comentario' : 'comentarios'}</span>
                    </button>
                  </div>

                  {/* Share Reference indicator */}
                  <div className="text-[10px] text-slate-450 font-bold tracking-widest uppercase font-mono">
                    Ref #{post.id.substring(post.id.length - 4).toUpperCase()}
                  </div>
                </div>

                {/* Expanded Comments Section */}
                {expandedCommentsPostId === post.id && (
                  <div className="bg-slate-50 border-t border-slate-150 p-4 sm:p-5 space-y-4 animate-slideDown">
                    {/* List of comments */}
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {postComments.length === 0 ? (
                        <p className="text-[10.5px] text-slate-400 italic text-center py-2">
                          No hay respuestas aún. ¡Sé el primero en aportar a la conversación!
                        </p>
                      ) : (
                        postComments.map((comment) => (
                          <div key={comment.id} className="flex gap-2.5 items-start">
                            {/* Little badge with initials */}
                            <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-[9px] font-black font-mono shrink-0 mt-0.5">
                              {comment.hotelName.substring(0, 2).toUpperCase()}
                            </div>

                            <div className="bg-white border border-slate-201 rounded-xl p-3 flex-1 min-w-0 shadow-2xs">
                              <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10.5px] font-black text-slate-800 leading-none">
                                    {comment.hotelName}
                                  </span>
                                  <span className="text-[8px] bg-slate-100 text-slate-500 rounded px-1 py-0.2 font-extrabold uppercase leading-none">
                                    {comment.hotelType}
                                  </span>
                                </div>
                                <span className="text-[9px] text-slate-400 font-medium whitespace-nowrap">
                                  {formatRelativeTime(comment.createdAt)}
                                </span>
                              </div>

                              <p className="text-[11px] text-slate-705 leading-relaxed">
                                {comment.content}
                              </p>

                              <div className="text-[8.5px] text-slate-400 mt-1 italic font-medium">
                                Por {comment.authorName} ({comment.authorRole})
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Comment composer box inside expanded view */}
                    <div className="flex gap-2 items-end pt-2 border-t border-slate-200/50">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          required
                          placeholder={`Responder como ${activeHotel.name}...`}
                          value={newCommentTexts[post.id] || ''}
                          onChange={(e) => setNewCommentTexts(prev => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleAddComment(post.id);
                            }
                          }}
                          className="w-full bg-white border border-slate-205 focus:border-indigo-400 rounded-xl py-2 pl-3 pr-10 text-xs text-slate-800 focus:outline-hidden"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 font-mono font-bold uppercase pointer-events-none select-none">
                          ENTER
                        </span>
                      </div>

                      <button
                        onClick={() => handleAddComment(post.id)}
                        disabled={commentingLoader[post.id] || !(newCommentTexts[post.id] || '').trim()}
                        className="bg-indigo-650 hover:bg-indigo-600 disabled:opacity-40 text-white rounded-xl p-2 transition-all cursor-pointer self-stretch flex items-center justify-center shrink-0 w-9"
                        title="Enviar comentario"
                      >
                        {commentingLoader[post.id] ? (
                          <div className="w-3.5 h-3.5 border-2 border-white/60 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Manual FAQ or Alliance Guidelines Sidebar cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 flex gap-3">
          <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 shrink-0 h-9">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800 uppercase font-mono tracking-wide">Código de Cooperación Sinergia</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed mt-1">
              Este canal es exclusivamente para la administración hotelera. Evita divulgar datos confidenciales de huéspedes reales. Ofrece tarifas netas, negocia compras de insumos por volumen y organiza ferias de empleo locales de forma ética.
            </p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 flex gap-3">
          <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 shrink-0 h-9">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800 uppercase font-mono tracking-wide">Tecnología Real-Time Multi-Tenant</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed mt-1">
              Las publicaciones están sincronizadas mediante sockets en tiempo real con Google Cloud Firestore. Cualquier mensaje subido por un hotel afiliado se visualiza de inmediato en toda la red centralizada.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
