export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  date: string;
  author: string;
  image: string;
  tags: string[];
}

export interface Post {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string;
  tags: string[];
}