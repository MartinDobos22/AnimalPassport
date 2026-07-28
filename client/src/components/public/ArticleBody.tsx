import { useState } from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import Callout from './Callout';
import RichText from './RichText';
import Lightbox, { type LightboxImage } from './Lightbox';
import GalleryCarousel from './GalleryCarousel';
import { slugifyHeading } from '../../utils/slugifyHeading';
import { toEmbedSrc } from '../../utils/embedUrl';
import type { ArticleSection } from '../../content/poradna/types';

interface Props {
  sections: ArticleSection[];
}

// Render tela článku (sekcie H2 + bloky). Zdieľané verejnou stránkou
// (PoradnaArticlePage) aj admin náhľadom, aby sa vzhľad nerozišiel.
export default function ArticleBody({ sections }: Props) {
  const theme = useTheme();
  const [lightbox, setLightbox] = useState<{ images: LightboxImage[]; index: number } | null>(null);

  return (
    <>
      {sections.map((section, i) => (
        <Box
          component="section"
          key={section.heading || i}
          sx={{ mt: i === 0 ? 0 : theme.spacing(5) }}
        >
          {section.heading.trim() && (
            <Typography
              variant="h4"
              component="h2"
              id={slugifyHeading(section.heading)}
              sx={{ mb: theme.spacing(2), scrollMarginTop: theme.spacing(10) }}
            >
              {section.heading}
            </Typography>
          )}
          {section.blocks.map((block, j) => {
            switch (block.type) {
              case 'paragraph':
                return (
                  <Typography
                    key={j}
                    variant="body1"
                    color="text.primary"
                    sx={{ mb: theme.spacing(2), lineHeight: 1.8, textAlign: block.align }}
                  >
                    <RichText text={block.text} />
                  </Typography>
                );
              case 'quote':
                return (
                  <Typography
                    key={j}
                    component="blockquote"
                    variant="body1"
                    color="text.secondary"
                    sx={{
                      my: theme.spacing(3),
                      ml: 0,
                      pl: theme.spacing(2.5),
                      borderLeft: `4px solid ${theme.palette.divider}`,
                      fontStyle: 'italic',
                      lineHeight: 1.8,
                    }}
                  >
                    <RichText text={block.text} />
                  </Typography>
                );
              case 'divider':
                return (
                  <Box
                    key={j}
                    component="hr"
                    sx={{
                      my: theme.spacing(4),
                      border: 0,
                      borderTop: `1px solid ${theme.palette.divider}`,
                    }}
                  />
                );
              case 'bullets':
                return (
                  <Typography
                    key={j}
                    component={block.ordered ? 'ol' : 'ul'}
                    variant="body1"
                    color="text.primary"
                    sx={{ mb: theme.spacing(2), lineHeight: 1.8, pl: theme.spacing(3) }}
                  >
                    {block.items.map((item, k) => (
                      <li key={k}>
                        <RichText text={item} />
                      </li>
                    ))}
                  </Typography>
                );
              case 'subheading':
                return (
                  <Typography
                    key={j}
                    variant="h5"
                    component="h3"
                    id={slugifyHeading(block.text)}
                    sx={{
                      mt: theme.spacing(3),
                      mb: theme.spacing(1.5),
                      scrollMarginTop: theme.spacing(10),
                    }}
                  >
                    {block.text}
                  </Typography>
                );
              case 'callout':
                return (
                  <Callout key={j} variant={block.variant} title={block.title} text={block.text} />
                );
              case 'image':
                if (!block.src?.trim()) return null;
                return (
                  <Box key={j} component="figure" sx={{ m: 0, my: 3 }}>
                    <Box
                      component="img"
                      src={block.src}
                      alt={block.alt ?? ''}
                      loading="lazy"
                      sx={{
                        display: 'block',
                        width: block.width ? `${block.width}%` : '100%',
                        maxWidth: '100%',
                        height: 'auto',
                        borderRadius: (t) => `${t.shape.borderRadius}px`,
                      }}
                    />
                    {block.caption?.trim() && (
                      <Typography
                        component="figcaption"
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1, width: '100%', textAlign: 'left' }}
                      >
                        {block.caption}
                      </Typography>
                    )}
                  </Box>
                );
              case 'gallery': {
                const galleryImages: LightboxImage[] = block.images.filter((img) =>
                  img.src?.trim()
                );
                if (galleryImages.length === 0) return null;
                return (
                  <GalleryCarousel
                    key={j}
                    images={galleryImages}
                    onOpen={(index) => setLightbox({ images: galleryImages, index })}
                  />
                );
              }
              case 'embed': {
                const embedSrc = toEmbedSrc(block.provider, block.url);
                if (!embedSrc) return null;
                return (
                  <Box key={j} component="figure" sx={{ m: 0, my: 3 }}>
                    <Box
                      component="iframe"
                      src={embedSrc}
                      title={`Embed ${block.provider}`}
                      loading="lazy"
                      allowFullScreen
                      sx={{
                        width: '100%',
                        minHeight: theme.spacing(50),
                        border: 0,
                        borderRadius: (t) => `${t.shape.borderRadius}px`,
                      }}
                    />
                    {block.caption?.trim() && (
                      <Typography
                        component="figcaption"
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1, textAlign: 'left' }}
                      >
                        {block.caption}
                      </Typography>
                    )}
                  </Box>
                );
              }
              default:
                return null;
            }
          })}
        </Box>
      ))}
      <Lightbox
        images={lightbox?.images ?? []}
        index={lightbox?.index ?? null}
        onClose={() => setLightbox(null)}
        onIndexChange={(index) => setLightbox((lb) => (lb ? { ...lb, index } : lb))}
      />
    </>
  );
}
