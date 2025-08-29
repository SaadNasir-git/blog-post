'use client'

import { useEffect, useState, useCallback } from 'react';
import { BlogPost } from '@/types/blog';
import BlogCard from '@/components/BlogCard';
import { Search, Filter, ChevronLeft, ChevronRight, Tags } from 'lucide-react';
import axios from 'axios';

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const availableTags = ['nextjs','typescript' , 'mongodb'];
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 12
  });

  const fetchBlogs = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        sortBy,
        ...(searchQuery && { search: searchQuery }),
        ...(selectedTags.length > 0 && { tags: selectedTags.join(',') })
      });

      const response = await axios.get(`/api/fetch-blogs?${params}`);
      
      if (response.data.success) {
        setBlogPosts(response.data.data);
        setPagination(response.data.pagination);
        
        // Extract unique tags from all posts
        // const allTags = response.data.data.flatMap((post: BlogPost) => 
        //   Array.isArray(post.tags) ? post.tags : []
        // );
        // const uniqueTags = Array.from(new Set(allTags)).filter(Boolean) as string[];
        // setAvailableTags(uniqueTags);
      } else {
        setError('Failed to fetch blog posts');
      }
    } catch (err) {
      console.error('Error fetching blogs:', err);
      setError('An error occurred while fetching blog posts');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedTags, sortBy]);

  // Initial fetch and when filters change
  useEffect(() => {
    fetchBlogs(1);
  }, [fetchBlogs]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSearch = () => {
    fetchBlogs(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchBlogs(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setSortBy('newest');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-6">
          Blog Articles
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
          Explore insights, tutorials, and thoughts on web development, design, and technology.
        </p>

        {/* Search and Filter Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-12 pr-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800 text-white"
            />
            <button
              onClick={handleSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md text-sm"
            >
              Search
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-300">Filter by:</span>
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {availableTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedTags.includes(tag)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
              >
                {tag}
              </button>
            ))}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
            className="px-3 py-1.5 border border-gray-600 rounded-lg bg-gray-800 text-white text-sm"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        {/* Active Filters */}
        {(searchQuery || selectedTags.length > 0) && (
          <div className="flex flex-wrap gap-2 justify-center items-center mb-4">
            <Tags className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">Active filters:</span>
            {searchQuery && (
              <span className="px-2 py-1 bg-blue-600 text-white rounded-full text-sm">
                Search: {searchQuery}
              </span>
            )}
            {selectedTags.map(tag => (
              <span key={tag} className="px-2 py-1 bg-blue-600 text-white rounded-full text-sm">
                {tag}
              </span>
            ))}
            <button
              onClick={clearFilters}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Results Count */}
        <div className="text-sm text-gray-400">
          {pagination.totalItems} article{pagination.totalItems !== 1 ? 's' : ''} found
          {selectedTags.length > 0 && ` in ${selectedTags.join(', ')}`}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="text-center py-12 px-4">
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
              onClick={() => fetchBlogs(pagination.currentPage)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Blog Posts Grid */}
      {!isLoading && !error && blogPosts.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {blogPosts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>
            
            <div className="flex gap-2">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                // Show pages around current page
                let pageNum = pagination.currentPage - 2 + i;
                if (pageNum < 1) pageNum = i + 1;
                if (pageNum > pagination.totalPages) pageNum = pagination.totalPages - (4 - i);
                return pageNum;
              }).map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    page === pagination.currentPage
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </>
      )}

      {/* Empty State */}
      {!isLoading && !error && blogPosts.length === 0 && (
        <div className="text-center py-12 px-4">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              No articles found
            </h3>
            <p className="text-gray-400">
              Try adjusting your search or filters to find what you{'\''}re looking for.
            </p>
            {(searchQuery || selectedTags.length > 0) && (
              <button
                onClick={clearFilters}
                className="mt-4 text-blue-400 hover:text-blue-300 font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}