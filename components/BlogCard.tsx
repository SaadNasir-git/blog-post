import Link from 'next/link';
import { BlogPost } from '@/types/blog';
import { CldImage } from 'next-cloudinary';

interface BlogCardProps {
  post: BlogPost;
}

export default function BlogCard({ post }: BlogCardProps) {
  return (
    <article key={post.title} className="card hover:shadow-lg transition-shadow">
      <div className="relative h-48 w-full overflow-hidden">
        <CldImage
          src={post.image}
          alt={post.title}
          width={500}
          height={500}
          className="object-cover"
        />
      </div>
      <div className="p-6">
        <div className="flex items-center text-sm text-gray-400 mb-2">
          <time dateTime={post.date}>{new Date(post.date).toLocaleDateString()}</time>
          <span className="mx-2">•</span>
          <span>{post.author}</span>
        </div>
        <h2 className="text-xl font-semibold text-white mb-3">
          <Link href={`/blog/${post.slug}`} className="hover:text-blue-400 transition-colors">
            {post.title}
          </Link>
        </h2>
        <p className="text-gray-300 mb-4 line-clamp-2">
          {post.excerpt}
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 text-xs font-medium bg-blue-900 text-blue-200 rounded-full cursor-default"
            >
              {tag}
            </span>
          ))}
        </div>
        <Link
          href={`/blog/${post.slug}`}
          className="bg-blue-600 hover:bg-blue-700 font-medium transition-colors w-full block text-center py-2 px-4 rounded-xl"
        >
          Read more
        </Link>
      </div>
    </article>
  );
}