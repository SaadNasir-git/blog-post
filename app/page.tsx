'use client'

import Link from 'next/link';
import BlogCard from '@/components/BlogCard';
import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { BlogPost } from '@/types/blog';
import Loader from '@/components/Loader';

export default function Home() {
  const [featuredPosts, setFeaturedPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeaturedPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(`/api/fetch-blogs?limit=3&sortBy=newest`);

      if (response.data.success) {
        setFeaturedPosts(response.data.data);
      } else {
        setError('Failed to fetch featured posts');
      }
    } catch (err) {
      console.error('Error fetching featured posts:', err);
      setError('An error occurred while fetching featured posts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeaturedPosts();
  }, [fetchFeaturedPosts]);

  return (
    <div className="space-y-20 bg-black">
      {/* Enhanced Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-gray-900 to-gray-800"></div>
        <div className="absolute top-0 right-0 -z-10 w-1/3 h-full bg-gradient-to-l from-gray-900 to-transparent"></div>

        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center rounded-full bg-blue-900/30 px-4 py-2 text-sm font-medium text-blue-300 mb-6">
              <span className="mr-2">✨</span> Latest insights on web development
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Crafting Digital Experiences Through Code
            </h1>

            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              Discover tutorials, insights, and best practices for modern web development with Next.js, React, and beyond.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/blog"
                className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-4 rounded-full flex items-center justify-center transition-all hover:shadow-lg"
              >
                Explore Articles
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute left-10 bottom-10 w-20 h-20 rounded-full bg-blue-800/30 opacity-50"></div>
        <div className="absolute right-20 top-20 w-12 h-12 rounded-full bg-purple-800/30 opacity-50"></div>
        <div className="absolute left-1/4 top-1/3 w-16 h-16 rounded-full bg-indigo-800/30 opacity-50"></div>
      </section>

      {/* Enhanced Featured Posts Section */}
      <section className="container mx-auto px-4 py-12 bg-black">

        {/* Loading State */}
        {isLoading && (
          <Loader />
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="text-center py-12 px-4 bg-black">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                <span className="text-2xl text-red-500">!</span>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                Error Loading Content
              </h3>
              <p className="text-gray-400 mb-4">
                {error}
              </p>
              <button
                onClick={fetchFeaturedPosts}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Featured Posts Grid */}
        {!isLoading && !error && featuredPosts.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-black">
              {featuredPosts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>

            <div className="text-center mt-10 bg-black">
              <Link
                href="/blog"
                className="inline-flex items-center text-blue-400 hover:text-blue-200 font-medium transition-colors group"
              >
                View all articles
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </>
        )}

        {/* Empty State */}
        {!isLoading && !error && featuredPosts.length === 0 && (
          <div className="text-center py-12 px-4">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                No articles yet
              </h3>
              <p className="text-gray-400">
                Check back soon for new content.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}