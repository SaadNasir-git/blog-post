'use client'

import { BlogPost } from '@/types/blog';
import { use, useEffect, useState } from 'react';
import axios from 'axios';
import { CldImage } from 'next-cloudinary';
import { common, createLowlight } from 'lowlight';
import { toHtml } from 'hast-util-to-html';
import { notFound } from 'next/navigation';
import Loader from '@/components/Loader';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const slug = use(params);
  const [loading, setloading] = useState(true)
  const [post, setPost] = useState<BlogPost>()

  useEffect(() => {
    const fetch = async () => {
      const response = await axios.post('/api/fetch-blog', slug);
      console.log(response.data.data)
      setPost(response.data.data)
      setloading(false)
    }
    if (loading && slug) {
      fetch()
    }
  }, [loading, slug])

  useEffect(() => {
    if (!loading && !post) {
      notFound()
    }
  }, [post, loading])


  const lowlight = createLowlight(common);

  useEffect(() => {
    if (!post) return;

    // Use requestAnimationFrame to ensure DOM is fully rendered
    const timer = setTimeout(() => {
      const preElements = document.querySelectorAll('pre');

      preElements.forEach((pre) => {
        // Skip if this pre already has a copy button (to avoid duplicates)
        if (pre.querySelector('.copy-button')) return;

        const copyButton = document.createElement('button');
        copyButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
          <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
        </svg>
      `;
        copyButton.classList.add(
          'absolute',
          '-top-[5px]',
          '-right-[5px]',
          'p-2',
          'bg-gray-700',
          'hover:bg-gray-600',
          'text-white',
          'rounded',
          'opacity-80',
          'hover:opacity-100',
          'transition-opacity',
          'focus:outline-none',
          'flex',
          'copy-button' // Add a class to identify copy buttons
        );
        copyButton.title = 'Copy code';

        // Store original innerHTML to restore later
        const originalHTML = copyButton.innerHTML;

        copyButton.addEventListener('click', () => {
          const codeContent = pre.querySelector('code')?.textContent || '';
          navigator.clipboard.writeText(codeContent);

          // Show success icon
          copyButton.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="green" viewBox="0 0 16 16">
            <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
          </svg>
        `;

          setTimeout(() => {
            // Revert to copy icon
            copyButton.innerHTML = originalHTML;
          }, 2000);
        });

        const html = `<div class='relative ribbon'></div>`
        pre.querySelector('code')?.classList.add('w-full', 'block', 'overflow-auto')
        pre.classList.add('my-4', 'bg-gray-800', 'p-4', 'rounded-lg', 'overflow-hidden');
        pre.insertAdjacentHTML('afterbegin', html);
        pre.querySelector('.ribbon')?.insertAdjacentElement('afterbegin', copyButton)


        // Update the highlighted code
        try {
          const codeElement = pre.querySelector('code');
          if (codeElement && codeElement.textContent) {
            // Extract language from class (e.g., "language-javascript")
            const languageClass = Array.from(codeElement.classList).find(cls =>
              cls.startsWith('language-')
            );
            const language = languageClass ? languageClass.replace('language-', '') : 'plaintext';

            const result = lowlight.highlight(language, codeElement.textContent);
            codeElement.innerHTML = toHtml(result);
          }
        } catch (error) {
          console.error('Error updating code highlight:', error);
        }
      });
    }, 100); // Small delay to ensure DOM is ready

    return () => {
      // Cleanup: remove all copy buttons when component unmounts or post changes
      clearTimeout(timer);
      document.querySelectorAll('.copy-button').forEach(btn => btn.remove());
    };
  }, [post, lowlight]); 

  if (loading && !post) {
    return (
      <main className='h-screen flex items-center justify-center bg-gray-900'>
        <Loader />
      </main>
    )
  }

  if (!loading && slug && post) {

    return (
      <main className='w-full bg-gray-900 p-4'>
        <article className="mx-auto py-10 container md:w-3/5">
          <div className="relative h-64 md:h-96 w-full mb-8 rounded-xl overflow-hidden">
            <CldImage
              src={post.image}
              alt={post.title}
              width={500}
              height={500}
              className="object-cover"
            />
          </div>

          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {post.title}
            </h1>

            <div className="flex items-center text-sm text-gray-400 mb-4">
              <time dateTime={post.date}>{new Date(post.date).toLocaleDateString()}</time>
              <span className="mx-2">•</span>
              <span>{post.author}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 text-sm font-medium bg-blue-900 text-blue-200 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </header>

          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 text-xl mb-8 border-l-4 border-l-gray-600 p-4">
              {"\""}{post.excerpt}{"\""}
            </p>

            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>
        </article>
      </main>
    );
  }
}
