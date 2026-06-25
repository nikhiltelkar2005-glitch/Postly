import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

export default function RichEditor({ content, onChange, placeholder = 'Write something...' }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'rich-editor-content',
      },
    },
  });

  if (!editor) return null;

  const ToolBtn = ({ onClick, active, label, icon }) => (
    <button
      type="button"
      className={`rich-tool-btn ${active ? 'active' : ''}`}
      onClick={onClick}
      title={label}
    >
      {icon}
    </button>
  );

  return (
    <div className="rich-editor">
      <div className="rich-toolbar">
        <ToolBtn
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          label="Bold"
          icon={<strong>B</strong>}
        />
        <ToolBtn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          label="Italic"
          icon={<em>I</em>}
        />
        <ToolBtn
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          label="Strikethrough"
          icon={<span style={{ textDecoration: 'line-through' }}>S</span>}
        />
        <span className="rich-divider" />
        <ToolBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          label="Heading"
          icon={<span style={{ fontWeight: 700, fontSize: 15 }}>H2</span>}
        />
        <ToolBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          label="Subheading"
          icon={<span style={{ fontWeight: 600, fontSize: 13 }}>H3</span>}
        />
        <span className="rich-divider" />
        <ToolBtn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          label="Bullet list"
          icon={<span>&#8226;</span>}
        />
        <ToolBtn
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          label="Ordered list"
          icon={<span>1.</span>}
        />
        <span className="rich-divider" />
        <ToolBtn
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          label="Quote"
          icon={<span>&#8220;</span>}
        />
        <ToolBtn
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive('code')}
          label="Code"
          icon={<code>&lt;/&gt;</code>}
        />
        <span className="rich-divider" />
        <ToolBtn
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          label="Horizontal rule"
          icon={<span>&mdash;</span>}
        />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
