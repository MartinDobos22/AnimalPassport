import { Navigate, useParams } from 'react-router-dom';
import Seo from '../../components/Seo';
import BlogLayout from '../../components/public/BlogLayout';
import ArticleView from '../../components/public/ArticleView';
import { articleJsonLd } from '../../utils/seoSchema';
import { articleHref, PORADNA_PATH } from '../../utils/articleHref';
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
  // seo.path ostáva bez lomky — prerender/canonical ju doplní (withTrailingSlash).
  // JSON-LD ale musí niesť rovno 200-URL s lomkou, aby štruktúrované dáta sedeli
  // s canonicalom a Google neobjavil bez-lomkovú (redirectujúcu) verziu.
  const path = `/poradna/${article.slug}`;
  const canonicalPath = articleHref(article.slug);
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
      path: canonicalPath,
      updated: article.updated,
      image: article.coverImage,
      faqs: article.faqs,
      breadcrumbs: [
        { name: 'Pawly', path: '/' },
        { name: 'Poradňa', path: PORADNA_PATH },
        { name: article.title, path: canonicalPath },
      ],
    }),
  };
}

export default function PoradnaArticlePage({ darkMode, onToggleTheme, slug: slugProp }: Props) {
  const params = useParams();
  const slug = slugProp ?? params.slug;
  const article = slug ? getArticle(slug) : undefined;

  useArticleTracking(article?.slug);

  if (!article) return <Navigate to={PORADNA_PATH} replace />;

  return (
    <BlogLayout darkMode={darkMode} onToggleTheme={onToggleTheme}>
      <Seo {...articleSeo(article)} />
      <ArticleView article={article} />
    </BlogLayout>
  );
}
