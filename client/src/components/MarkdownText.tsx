import type { ReactNode } from 'react';

/**
 * Lightweight markdown renderer for chat messages.
 * Supports: headings, bold, lists, horizontal rules, tables, blockquotes, numbered lists, paragraphs.
 */

function parseInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(<strong key={match.index}>{match[1]}</strong>);
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

function isTableRow(line: string): boolean {
  return /^\|.+\|$/.test(line.trim());
}

function isTableSeparator(line: string): boolean {
  return /^\|[\s\-:|]+\|$/.test(line.trim());
}

function parseTableCells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

interface MarkdownTextProps {
  content: string;
}

export default function MarkdownText({ content }: MarkdownTextProps) {
  const lines = content.split('\n');
  const elements: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      elements.push(<hr key={i} className="my-3 border-border" />);
      i++;
      continue;
    }

    // Table block
    if (isTableRow(line)) {
      const headerCells = parseTableCells(line);
      i++;

      // Skip separator row
      if (i < lines.length && isTableSeparator(lines[i])) {
        i++;
      }

      // Collect body rows
      const bodyRows: string[][] = [];
      while (i < lines.length && isTableRow(lines[i]) && !isTableSeparator(lines[i])) {
        bodyRows.push(parseTableCells(lines[i]));
        i++;
      }

      elements.push(
        <div key={`table-${i}`} className="my-2 overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-border">
                {headerCells.map((cell, ci) => (
                  <th key={ci} className="px-2 py-1.5 text-left font-semibold text-primary">
                    {parseInline(cell)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyRows.map((row, ri) => (
                <tr key={ri} className="border-b border-border/50">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-2 py-1.5 text-secondary">
                      {parseInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    // Heading ### / ## / #
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      const className =
        level === 1
          ? 'text-sm font-semibold mt-3 mb-1.5'
          : level === 2
            ? 'text-sm font-semibold mt-2.5 mb-1'
            : 'text-[13px] font-semibold mt-2 mb-1';

      elements.push(
        <p key={i} className={className}>
          {parseInline(text)}
        </p>,
      );
      i++;
      continue;
    }

    // Blockquote
    if (/^>\s/.test(line)) {
      const quoteLines: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      elements.push(
        <blockquote
          key={`bq-${i}`}
          className="my-2 pl-3 border-l-2 border-accent/40 text-secondary"
        >
          {quoteLines.map((ql, qi) => (
            <p key={qi} className="my-0.5">
              {parseInline(ql)}
            </p>
          ))}
        </blockquote>,
      );
      continue;
    }

    // Unordered list block (consecutive - lines)
    if (/^\s*-\s/.test(line)) {
      const items: ReactNode[] = [];
      while (i < lines.length && /^\s*-\s/.test(lines[i])) {
        const itemText = lines[i].replace(/^\s*-\s+/, '');
        items.push(
          <li key={i} className="flex gap-1.5">
            <span className="text-secondary shrink-0 mt-0.5">&#8226;</span>
            <span>{parseInline(itemText)}</span>
          </li>,
        );
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="space-y-0.5 my-1">
          {items}
        </ul>,
      );
      continue;
    }

    // Numbered list block
    if (/^\s*\d+\.\s/.test(line)) {
      const items: ReactNode[] = [];
      while (i < lines.length && /^\s*\d+\.\s/.test(lines[i])) {
        const itemText = lines[i].replace(/^\s*\d+\.\s+/, '');
        const num = lines[i].match(/^\s*(\d+)\./)?.[1] ?? '1';
        items.push(
          <li key={i} className="flex gap-1.5">
            <span className="text-secondary shrink-0 font-medium min-w-4">{num}.</span>
            <span>{parseInline(itemText)}</span>
          </li>,
        );
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="space-y-0.5 my-1">
          {items}
        </ol>,
      );
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i} className="my-1">
        {parseInline(line)}
      </p>,
    );
    i++;
  }

  return <div className="text-sm leading-relaxed space-y-0">{elements}</div>;
}
