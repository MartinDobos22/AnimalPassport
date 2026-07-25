import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import EmbedNodeView from './EmbedNodeView';
import type { EmbedProvider } from '../../../content/poradna/types';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    embed: {
      setEmbed: (attrs?: {
        provider?: EmbedProvider;
        url?: string;
        caption?: string;
      }) => ReturnType;
    };
  }
}

export const EmbedNode = Node.create({
  name: 'embed',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      provider: { default: 'facebook' as EmbedProvider },
      url: { default: '' },
      caption: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-embed]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes({ 'data-embed': '' }, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(EmbedNodeView);
  },

  addCommands() {
    return {
      setEmbed:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              provider: attrs?.provider ?? 'facebook',
              url: attrs?.url ?? '',
              caption: attrs?.caption ?? null,
            },
          }),
    };
  },
});
