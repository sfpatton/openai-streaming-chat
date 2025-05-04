// File: MarkdownRenderer.js
// Location: openai-streaming-chat\client\src\components\MarkdownRenderer.js

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

/**
 * Component for rendering markdown content with code syntax highlighting
 * @param {Object} props - Component props
 * @param {string} props.content - Markdown content to render
 * @returns {JSX.Element} Rendered markdown with syntax highlighting
 */
const MarkdownRenderer = ({ content }) => {
  return (
    <ReactMarkdown
      children={content}
      components={{
        // Add syntax highlighting for code blocks
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <SyntaxHighlighter
              children={String(children).replace(/\n$/, '')}
              style={vscDarkPlus}
              language={match[1]}
              PreTag="div"
              {...props}
            />
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
        // Customize links to open in new tab with security attributes
        a({ node, children, href, ...props }) {
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            >
              {children}
            </a>
          );
        },
        // Add custom styles to tables
        table({ node, ...props }) {
          return (
            <div className="table-container">
              <table className="markdown-table" {...props} />
            </div>
          );
        }
      }}
    />
  );
};

export default MarkdownRenderer;
