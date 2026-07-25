import { useMemo, useRef, useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Menu,
  MenuItem,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  type ToggleButtonProps,
  Tooltip,
  Typography,
} from '@mui/material';
import { styled, type Theme } from '@mui/material/styles';
import {
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatUnderlined as UnderlineIcon,
  StrikethroughS as StrikeIcon,
  FormatListBulleted as BulletsIcon,
  FormatListNumbered as NumberedIcon,
  FormatQuote as QuoteIcon,
  HorizontalRule as DividerIcon,
  FormatAlignLeft as AlignLeftIcon,
  FormatAlignCenter as AlignCenterIcon,
  FormatAlignRight as AlignRightIcon,
  InsertLink as LinkIcon,
  LinkOff as LinkOffIcon,
  ArrowDropDown as ArrowDropDownIcon,
  TextFieldsOutlined as SubheadingIcon,
  LightbulbOutlined as CalloutIcon,
  DragIndicator as DragIcon,
  AddPhotoAlternateOutlined as ImageIcon,
  CollectionsOutlined as GalleryIcon,
  MenuBookOutlined as ArticleLinkIcon,
  OndemandVideoOutlined as EmbedIcon,
} from '@mui/icons-material';
import {
  useEditor,
  EditorContent,
  useEditorState,
  ReactNodeViewRenderer,
  type Editor,
} from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { DragHandle } from '@tiptap/extension-drag-handle-react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import { CalloutNode } from './CalloutNode';
import { GalleryNode } from './GalleryNode';
import { EmbedNode } from './EmbedNode';
import ImageNodeView from './ImageNodeView';
import ArticlePickerDialog from './ArticlePickerDialog';
import { sectionsToTiptap, tiptapToSections } from './articleTiptapBridge';
import { uploadArticleImage } from '../../../services/adminApi';
import type { ArticleSection } from '../../../content/poradna/types';

interface Props {
  value: ArticleSection[];
  onChange: (sections: ArticleSection[]) => void;
  /** DOM slot v sticky hlavičke stránky — ak je zadaný, lišta sa doň portáluje. */
  toolbarContainer?: HTMLElement | null;
}

const EditorShell = styled(Box)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: `${theme.shape.borderRadius}px`,
  '& .ProseMirror': {
    minHeight: theme.spacing(40),
    padding: theme.spacing(2),
    paddingLeft: theme.spacing(4),
    outline: 'none',
    lineHeight: 1.8,
  },
  '& .ProseMirror .is-editor-empty:first-of-type::before': {
    content: 'attr(data-placeholder)',
    color: theme.palette.text.disabled,
    float: 'left',
    height: 0,
    pointerEvents: 'none',
  },
  '& .ProseMirror:focus': {
    outline: 'none',
  },
  '& .ProseMirror h2': {
    ...theme.typography.h4,
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(1.5),
  },
  '& .ProseMirror h3': {
    ...theme.typography.h5,
    marginTop: theme.spacing(2.5),
    marginBottom: theme.spacing(1),
  },
  '& .ProseMirror p': {
    margin: `0 0 ${theme.spacing(1.5)}`,
  },
  '& .ProseMirror ul, & .ProseMirror ol': {
    paddingLeft: theme.spacing(3),
    marginBottom: theme.spacing(1.5),
  },
  '& .ProseMirror blockquote': {
    margin: `${theme.spacing(2)} 0`,
    paddingLeft: theme.spacing(2.5),
    borderLeft: `4px solid ${theme.palette.divider}`,
    color: theme.palette.text.secondary,
    fontStyle: 'italic',
  },
  '& .ProseMirror hr': {
    margin: `${theme.spacing(3)} 0`,
    border: 0,
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  '& .ProseMirror a': {
    color: theme.palette.primary.main,
  },
  '& .ProseMirror img': {
    maxWidth: '100%',
    height: 'auto',
    borderRadius: `${theme.shape.borderRadius}px`,
    margin: `${theme.spacing(2)} 0`,
  },
  '& .ProseMirror img.ProseMirror-selectednode': {
    outline: `2px solid ${theme.palette.primary.main}`,
  },
  '& .ProseMirror:first-of-type > :first-of-type': {
    marginTop: 0,
  },
}));

// Zabráni strate fokusu/výberu v editore pri kliknutí na tlačidlo lišty.
// Bez toho contenteditable stratí výber a blokové príkazy (nadpisy, zoznamy)
// nemajú na čom pracovať.
function ToolButton(props: ToggleButtonProps) {
  return (
    <ToggleButton
      {...props}
      onMouseDown={(e) => {
        e.preventDefault();
        props.onMouseDown?.(e);
      }}
    />
  );
}

function HeadingMenu({ editor }: { editor: Editor }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      isH2: e.isActive('heading', { level: 2 }),
      isH3: e.isActive('heading', { level: 3 }),
    }),
  });

  const label = state.isH2 ? 'Nadpis 2' : state.isH3 ? 'Nadpis 3' : 'Normálny text';

  const apply = (level: 0 | 2 | 3) => {
    if (level === 0) editor.chain().focus().setParagraph().run();
    else editor.chain().focus().setHeading({ level }).run();
    setAnchor(null);
  };

  const keepSelection = (e: MouseEvent) => e.preventDefault();

  return (
    <>
      <Button
        size="small"
        color="inherit"
        startIcon={<SubheadingIcon fontSize="small" />}
        endIcon={<ArrowDropDownIcon fontSize="small" />}
        onMouseDown={keepSelection}
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{ textTransform: 'none', minWidth: (t) => t.spacing(18), justifyContent: 'flex-start' }}
      >
        {label}
      </Button>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        <MenuItem
          selected={!state.isH2 && !state.isH3}
          onMouseDown={keepSelection}
          onClick={() => apply(0)}
        >
          Normálny text
        </MenuItem>
        <MenuItem selected={state.isH2} onMouseDown={keepSelection} onClick={() => apply(2)}>
          Nadpis 2 (sekcia)
        </MenuItem>
        <MenuItem selected={state.isH3} onMouseDown={keepSelection} onClick={() => apply(3)}>
          Nadpis 3 (podnadpis)
        </MenuItem>
      </Menu>
    </>
  );
}

interface ToolbarProps {
  editor: Editor;
  onLinkRequest: () => void;
}

interface MainToolbarProps extends ToolbarProps {
  onImageRequest: () => void;
  onArticleLinkRequest: () => void;
  inHeader: boolean;
}

function Toolbar({
  editor,
  onLinkRequest,
  onImageRequest,
  onArticleLinkRequest,
  inHeader,
}: MainToolbarProps) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      isBold: e.isActive('bold'),
      isItalic: e.isActive('italic'),
      isUnderline: e.isActive('underline'),
      isStrike: e.isActive('strike'),
      isBullets: e.isActive('bulletList'),
      isOrdered: e.isActive('orderedList'),
      isQuote: e.isActive('blockquote'),
      isCallout: e.isActive('callout'),
      isLink: e.isActive('link'),
      isAlignCenter: e.isActive({ textAlign: 'center' }),
      isAlignRight: e.isActive({ textAlign: 'right' }),
    }),
  });

  const toggleCallout = () => {
    if (state.isCallout) {
      editor.chain().focus().setParagraph().run();
    } else {
      editor.chain().focus().setCallout().run();
    }
  };

  return (
    <Stack
      direction="row"
      spacing={0.5}
      flexWrap="wrap"
      alignItems="center"
      sx={{
        p: (t) => t.spacing(0.75),
        borderBottom: (t) => `1px solid ${t.palette.divider}`,
        ...(inHeader
          ? { position: 'static', bgcolor: 'background.default' }
          : {
              position: 'sticky',
              top: 0,
              zIndex: 1,
              bgcolor: 'background.paper',
              borderTopLeftRadius: (t: Theme) => `${t.shape.borderRadius}px`,
              borderTopRightRadius: (t: Theme) => `${t.shape.borderRadius}px`,
            }),
      }}
    >
      <HeadingMenu editor={editor} />
      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
      <Tooltip title="Tučné (Ctrl/Cmd+B)">
        <ToolButton
          value="bold"
          size="small"
          selected={state.isBold}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <BoldIcon fontSize="small" />
        </ToolButton>
      </Tooltip>
      <Tooltip title="Kurzíva (Ctrl/Cmd+I)">
        <ToolButton
          value="italic"
          size="small"
          selected={state.isItalic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <ItalicIcon fontSize="small" />
        </ToolButton>
      </Tooltip>
      <Tooltip title="Podčiarknuté (Ctrl/Cmd+U)">
        <ToolButton
          value="underline"
          size="small"
          selected={state.isUnderline}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon fontSize="small" />
        </ToolButton>
      </Tooltip>
      <Tooltip title="Prečiarknuté">
        <ToolButton
          value="strike"
          size="small"
          selected={state.isStrike}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <StrikeIcon fontSize="small" />
        </ToolButton>
      </Tooltip>
      <Tooltip title={state.isLink ? 'Upraviť odkaz' : 'Vložiť odkaz'}>
        <ToolButton value="link" size="small" selected={state.isLink} onClick={onLinkRequest}>
          <LinkIcon fontSize="small" />
        </ToolButton>
      </Tooltip>
      {state.isLink && (
        <Tooltip title="Odstrániť odkaz">
          <ToolButton
            value="unlink"
            size="small"
            onClick={() => editor.chain().focus().unsetLink().run()}
          >
            <LinkOffIcon fontSize="small" />
          </ToolButton>
        </Tooltip>
      )}
      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
      <Tooltip title="Zarovnať vľavo">
        <ToolButton
          value="alignLeft"
          size="small"
          selected={!state.isAlignCenter && !state.isAlignRight}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
        >
          <AlignLeftIcon fontSize="small" />
        </ToolButton>
      </Tooltip>
      <Tooltip title="Zarovnať na stred">
        <ToolButton
          value="alignCenter"
          size="small"
          selected={state.isAlignCenter}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
        >
          <AlignCenterIcon fontSize="small" />
        </ToolButton>
      </Tooltip>
      <Tooltip title="Zarovnať vpravo">
        <ToolButton
          value="alignRight"
          size="small"
          selected={state.isAlignRight}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
        >
          <AlignRightIcon fontSize="small" />
        </ToolButton>
      </Tooltip>
      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
      <Tooltip title="Odrážky">
        <ToolButton
          value="bullets"
          size="small"
          selected={state.isBullets}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <BulletsIcon fontSize="small" />
        </ToolButton>
      </Tooltip>
      <Tooltip title="Číslovaný zoznam">
        <ToolButton
          value="ordered"
          size="small"
          selected={state.isOrdered}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <NumberedIcon fontSize="small" />
        </ToolButton>
      </Tooltip>
      <Tooltip title="Citácia">
        <ToolButton
          value="quote"
          size="small"
          selected={state.isQuote}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <QuoteIcon fontSize="small" />
        </ToolButton>
      </Tooltip>
      <Tooltip title="Oddeľovač (čiara)">
        <ToolButton
          value="divider"
          size="small"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <DividerIcon fontSize="small" />
        </ToolButton>
      </Tooltip>
      <Tooltip title="Box (tip/pozor/info)">
        <ToolButton value="callout" size="small" selected={state.isCallout} onClick={toggleCallout}>
          <CalloutIcon fontSize="small" />
        </ToolButton>
      </Tooltip>
      <Tooltip title="Vložiť obrázok">
        <ToolButton value="image" size="small" onClick={onImageRequest}>
          <ImageIcon fontSize="small" />
        </ToolButton>
      </Tooltip>
      <Tooltip title="Galéria obrázkov">
        <ToolButton
          value="gallery"
          size="small"
          onClick={() => editor.chain().focus().setGallery().run()}
        >
          <GalleryIcon fontSize="small" />
        </ToolButton>
      </Tooltip>
      <Tooltip title="Vložiť odkaz na článok">
        <ToolButton value="articleLink" size="small" onClick={onArticleLinkRequest}>
          <ArticleLinkIcon fontSize="small" />
        </ToolButton>
      </Tooltip>
      <Tooltip title="Vložiť embed (Facebook, YouTube, Instagram)">
        <ToolButton
          value="embed"
          size="small"
          onClick={() => editor.chain().focus().setEmbed().run()}
        >
          <EmbedIcon fontSize="small" />
        </ToolButton>
      </Tooltip>
    </Stack>
  );
}

function BubbleToolbar({ editor, onLinkRequest }: ToolbarProps) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      isBold: e.isActive('bold'),
      isItalic: e.isActive('italic'),
      isUnderline: e.isActive('underline'),
      isStrike: e.isActive('strike'),
      isLink: e.isActive('link'),
    }),
  });

  return (
    <Paper
      elevation={4}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        p: 0.5,
        borderRadius: (t) => `${t.shape.borderRadius}px`,
      }}
    >
      <Tooltip title="Tučné">
        <ToolButton
          value="bold"
          size="small"
          selected={state.isBold}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <BoldIcon fontSize="small" />
        </ToolButton>
      </Tooltip>
      <Tooltip title="Kurzíva">
        <ToolButton
          value="italic"
          size="small"
          selected={state.isItalic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <ItalicIcon fontSize="small" />
        </ToolButton>
      </Tooltip>
      <Tooltip title="Podčiarknuté">
        <ToolButton
          value="underline"
          size="small"
          selected={state.isUnderline}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon fontSize="small" />
        </ToolButton>
      </Tooltip>
      <Tooltip title="Prečiarknuté">
        <ToolButton
          value="strike"
          size="small"
          selected={state.isStrike}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <StrikeIcon fontSize="small" />
        </ToolButton>
      </Tooltip>
      <Tooltip title={state.isLink ? 'Upraviť odkaz' : 'Vložiť odkaz'}>
        <ToolButton value="link" size="small" selected={state.isLink} onClick={onLinkRequest}>
          <LinkIcon fontSize="small" />
        </ToolButton>
      </Tooltip>
      {state.isLink && (
        <Tooltip title="Odstrániť odkaz">
          <ToolButton
            value="unlink"
            size="small"
            onClick={() => editor.chain().focus().unsetLink().run()}
          >
            <LinkOffIcon fontSize="small" />
          </ToolButton>
        </Tooltip>
      )}
    </Paper>
  );
}

export default function ArticleRichEditor({ value, onChange, toolbarContainer }: Props) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [articlePickerOpen, setArticlePickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialContent = useMemo(() => sectionsToTiptap(value), []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        link: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: false,
        HTMLAttributes: { rel: 'noopener nofollow' },
      }),
      TextAlign.configure({ types: ['paragraph'] }),
      Placeholder.configure({
        placeholder: 'Začni písať obsah článku… „H2" v lište začne novú sekciu.',
      }),
      Image.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            width: { default: null },
            caption: { default: null },
          };
        },
        addNodeView() {
          return ReactNodeViewRenderer(ImageNodeView);
        },
      }).configure({ inline: false }),
      CalloutNode,
      GalleryNode,
      EmbedNode,
    ],
    content: initialContent,
    onUpdate: ({ editor: e }) => {
      onChange(tiptapToSections(e.getJSON()));
    },
  });

  if (!editor) return null;

  const openLinkDialog = () => {
    const existing = editor.getAttributes('link').href;
    setLinkUrl(typeof existing === 'string' ? existing : '');
    setLinkOpen(true);
  };

  const applyLink = () => {
    const url = linkUrl.trim();
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    } else {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    }
    setLinkOpen(false);
  };

  const handleImageFile = async (file: File) => {
    setUploading(true);
    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      const { url } = await uploadArticleImage({ mimeType: file.type, base64Data });
      editor.chain().focus().setImage({ src: url }).run();
    } catch {
      /* admin uvidí, že sa obrázok nevložil */
    } finally {
      setUploading(false);
    }
  };

  const insertArticleLink = (article: { slug: string; title: string }) => {
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'text',
        text: article.title,
        marks: [{ type: 'link', attrs: { href: `/poradna/${article.slug}` } }],
      })
      .run();
  };

  const toolbar = (
    <Toolbar
      editor={editor}
      onLinkRequest={openLinkDialog}
      onImageRequest={() => fileInputRef.current?.click()}
      onArticleLinkRequest={() => setArticlePickerOpen(true)}
      inHeader={Boolean(toolbarContainer)}
    />
  );

  return (
    <Box>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleImageFile(f);
          e.target.value = '';
        }}
      />
      {toolbarContainer && createPortal(toolbar, toolbarContainer)}
      <EditorShell>
        {!toolbarContainer && toolbar}
        <DragHandle editor={editor}>
          <Box
            sx={{
              display: 'flex',
              color: 'text.disabled',
              cursor: 'grab',
              '&:active': { cursor: 'grabbing' },
              '&:hover': { color: 'text.secondary' },
            }}
          >
            <DragIcon fontSize="small" />
          </Box>
        </DragHandle>
        <BubbleMenu editor={editor}>
          <BubbleToolbar editor={editor} onLinkRequest={openLinkDialog} />
        </BubbleMenu>
        <EditorContent editor={editor} />
      </EditorShell>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        Píš priamo do textu. Označ slovo a použi lištu na tučné/odkaz. „H2" začína novú sekciu,
        „Box" premení odsek na zvýraznený box.{uploading ? ' · Nahrávam obrázok…' : ''}
      </Typography>

      <Dialog open={linkOpen} onClose={() => setLinkOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Odkaz</DialogTitle>
        <DialogContent>
          <TextField
            label="URL"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="/zdravotny-pas alebo https://…"
            helperText="Interný odkaz začni lomkou (/), externý celou adresou."
            fullWidth
            autoFocus
            margin="dense"
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyLink();
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkOpen(false)}>Zrušiť</Button>
          <Button onClick={applyLink} variant="contained">
            Použiť
          </Button>
        </DialogActions>
      </Dialog>

      <ArticlePickerDialog
        open={articlePickerOpen}
        onClose={() => setArticlePickerOpen(false)}
        onSelect={insertArticleLink}
        title="Vložiť odkaz na článok"
      />
    </Box>
  );
}
