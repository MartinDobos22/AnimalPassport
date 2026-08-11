import { Fragment, type ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Link } from '@mui/material';
import { withPoradnaCanonicalPath } from '../../utils/articleHref';

interface Props {
  text: string;
}

/**
 * Minimalistický inline parser: podporuje `**tučné**`, `*kurzíva*`,
 * `__podčiarknuté__`, `~~prečiarknuté~~` a `[text](url)`.
 * Interný odkaz (url začína `/`) ide cez RouterLink, externý cez <a> s nofollow.
 * Bez závislosti, SSR-safe.
 */
const TOKEN = /(\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;

function renderToken(token: string, key: number): ReactNode {
  if (token.startsWith('**') && token.endsWith('**')) {
    return <strong key={key}>{token.slice(2, -2)}</strong>;
  }
  if (token.startsWith('__') && token.endsWith('__')) {
    return <u key={key}>{token.slice(2, -2)}</u>;
  }
  if (token.startsWith('~~') && token.endsWith('~~')) {
    return <s key={key}>{token.slice(2, -2)}</s>;
  }
  const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
  if (linkMatch) {
    const [, label, url] = linkMatch;
    if (url.startsWith('/')) {
      return (
        <Link key={key} component={RouterLink} to={withPoradnaCanonicalPath(url)} underline="hover">
          {label}
        </Link>
      );
    }
    return (
      <Link key={key} href={url} target="_blank" rel="noopener nofollow" underline="hover">
        {label}
      </Link>
    );
  }
  if (token.startsWith('*') && token.endsWith('*')) {
    return <em key={key}>{token.slice(1, -1)}</em>;
  }
  return token;
}

export function renderRichText(text: string): ReactNode[] {
  const parts = text.split(TOKEN);
  return parts.map((part, i) =>
    i % 2 === 1 ? renderToken(part, i) : <Fragment key={i}>{part}</Fragment>
  );
}

export default function RichText({ text }: Props) {
  return <>{renderRichText(text)}</>;
}
