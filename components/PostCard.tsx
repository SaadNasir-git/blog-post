'use client';

import { Heart, MessageCircle, Share, MoreHorizontal, User } from 'lucide-react';
import { Post } from '../types/post';

interface PostCardProps {
  post: Post;
  onLike: (id: number) => void;
}

export default function PostCard({ post, onLike }: PostCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Post Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{post.name}</h3>
            <p className="text-sm text-gray-500">@{post.username} · {post.time}</p>
          </div>
        </div>
        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* Post Content */}
      <div className="mb-4">
        <p className="text-gray-800 leading-relaxed">{post.content}</p>
      </div>

      {/* Post Image (if any) */}
      {post.image && (
        <div className="mb-4 rounded-lg overflow-hidden">
          <div className="w-full h-48 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg"></div>
        </div>
      )}

      {/* Post Actions */}
      <div className="flex items-center justify-between text-gray-500">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onLike(post.id)}
            className={`flex items-center space-x-1 transition-colors ${
              post.isLiked ? 'text-red-600' : 'hover:text-red-600'
            }`}
          >
            <Heart className={`h-5 w-5 ${post.isLiked ? 'fill-current' : ''}`} />
            <span>{post.likes}</span>
          </button>
          <button className="flex items-center space-x-1 hover:text-blue-600 transition-colors">
            <MessageCircle className="h-5 w-5" />
            <span>{post.comments}</span>
          </button>
          <button className="flex items-center space-x-1 hover:text-green-600 transition-colors">
            <Share className="h-5 w-5" />
            <span>{post.shares}</span>
          </button>
        </div>
      </div>
    </div>
  );
}