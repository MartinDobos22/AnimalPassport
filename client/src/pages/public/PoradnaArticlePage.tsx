import { Navigate, useParams } from 'react-router-dom';
import Seo from '../../components/Seo';
import BlogLayout from '../../components/public/BlogLayout';
import ArticleView from '../../components/public/ArticleView';
import { articleJsonLd } from '../../utils/seoSchema';
import { useArticleTracking } from '../../hooks/useArticleTracking';
import { getArticle } from '../../content/poradna/articles';
import type { Article } from '../../content/poradna/types';

interface Props {
  darkMode: boolean;
  onToggleTheme: () => void;
  /** SSG posiela slug priamo; v appke sa berie z useParams. */
  slug?: string;
}

export function articleSeo(article: Article) {
  const path = `/poradna/${article.slug}`;
  return {
    title: `${article.title} | Pawly`,
    description: article.description,
    path,
    ogImage: article.coverImage,
    ogImageAlt: article.coverAlt,
    keywords: article.tags,
    jsonLd: articleJsonLd({
      title: article.title,
      description: article.description,
      path,
      updated: article.updated,
      image: article.coverImage,
      faqs: article.faqs,
      breadcrumbs: [
        { name: 'Pawly', path: '/' },
        { name: 'Poradňa', path: '/poradna' },
        { name: article.title, path },
      ],
    }),
  };
}

export default function PoradnaArticlePage({ darkMode, onToggleTheme, slug: slugProp }: Props) {
  const params = useParams();
  const slug = slugProp ?? params.slug;
  const article = slug ? getArticle(slug) : undefined;

  useArticleTracking(article?.slug);

  if (!article) return <Navigate to="/poradna" replace />;

  return (
    <BlogLayout darkMode={darkMode} onToggleTheme={onToggleTheme}>
      <Seo {...articleSeo(article)} />
      <ArticleView article={article} />
    </BlogLayout>
  );
}
