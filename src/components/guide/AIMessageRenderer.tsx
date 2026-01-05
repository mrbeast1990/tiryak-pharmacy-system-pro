import React from 'react';
import { AlertTriangle, Pill, FileText, RefreshCw, Info } from 'lucide-react';

interface AIMessageRendererProps {
  content: string;
}

const AIMessageRenderer: React.FC<AIMessageRendererProps> = ({ content }) => {
  const parseContent = (text: string): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    // Pattern to match our custom tags and markdown
    const patterns = [
      { regex: /\[SUMMARY\]([\s\S]*?)\[\/SUMMARY\]/g, type: 'summary' },
      { regex: /\[DOSE\]([\s\S]*?)\[\/DOSE\]/g, type: 'dose' },
      { regex: /\[WARNING\]([\s\S]*?)\[\/WARNING\]/g, type: 'warning' },
      { regex: /\[USAGE\]([\s\S]*?)\[\/USAGE\]/g, type: 'usage' },
      { regex: /\[ALT\]([\s\S]*?)\[\/ALT\]/g, type: 'alternative' },
    ];

    // Split content by tags while preserving order
    const allMatches: { index: number; endIndex: number; type: string; content: string }[] = [];

    patterns.forEach(({ regex, type }) => {
      let match;
      const regexCopy = new RegExp(regex.source, regex.flags);
      while ((match = regexCopy.exec(text)) !== null) {
        allMatches.push({
          index: match.index,
          endIndex: match.index + match[0].length,
          type,
          content: match[1].trim(),
        });
      }
    });

    // Sort by position
    allMatches.sort((a, b) => a.index - b.index);

    let lastIndex = 0;
    allMatches.forEach((match) => {
      // Add text before this match
      if (match.index > lastIndex) {
        const beforeText = text.slice(lastIndex, match.index);
        if (beforeText.trim()) {
          elements.push(
            <div key={key++} className="mb-2">
              {renderMarkdown(beforeText)}
            </div>
          );
        }
      }

      // Add the styled box
      elements.push(renderStyledBox(match.type, match.content, key++));
      lastIndex = match.endIndex;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      const afterText = text.slice(lastIndex);
      if (afterText.trim()) {
        elements.push(
          <div key={key++}>
            {renderMarkdown(afterText)}
          </div>
        );
      }
    }

    // If no custom tags found, render as markdown
    if (elements.length === 0) {
      return [<div key={0}>{renderMarkdown(text)}</div>];
    }

    return elements;
  };

  const renderStyledBox = (type: string, content: string, key: number): React.ReactNode => {
    switch (type) {
      case 'summary':
        return (
          <div key={key} className="bg-purple-50 border-r-4 border-purple-500 p-3 mb-3 rounded-l-lg">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-purple-800 text-sm">📌 ملخص سريع</p>
                <p className="text-purple-700 text-sm mt-1">{renderInlineMarkdown(content)}</p>
              </div>
            </div>
          </div>
        );

      case 'dose':
        return (
          <div key={key} className="bg-red-50 border-r-4 border-red-500 p-3 my-2 rounded-l-lg">
            <div className="flex items-start gap-2">
              <Pill className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-red-800 text-sm">💊 الجرعة</p>
                <div className="text-red-700 font-semibold text-sm mt-1">{renderInlineMarkdown(content)}</div>
              </div>
            </div>
          </div>
        );

      case 'warning':
        return (
          <div key={key} className="bg-orange-50 border-r-4 border-orange-500 p-3 my-2 rounded-l-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-orange-800 text-sm">⚠️ تحذير</p>
                <div className="text-orange-700 text-sm mt-1">{renderInlineMarkdown(content)}</div>
              </div>
            </div>
          </div>
        );

      case 'usage':
        return (
          <div key={key} className="bg-blue-50 border-r-4 border-blue-500 p-3 my-2 rounded-l-lg">
            <div className="flex items-start gap-2">
              <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-blue-800 text-sm">📝 طريقة الاستخدام</p>
                <div className="text-blue-700 text-sm mt-1">{renderInlineMarkdown(content)}</div>
              </div>
            </div>
          </div>
        );

      case 'alternative':
        return (
          <div key={key} className="bg-green-50 border-r-4 border-green-500 p-3 my-2 rounded-l-lg">
            <div className="flex items-start gap-2">
              <RefreshCw className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-green-800 text-sm">🔄 البدائل المتوفرة</p>
                <div className="text-green-700 text-sm mt-1">{renderInlineMarkdown(content)}</div>
              </div>
            </div>
          </div>
        );

      default:
        return <div key={key}>{renderMarkdown(content)}</div>;
    }
  };

  const renderInlineMarkdown = (text: string): React.ReactNode => {
    // Process bold text
    const parts: React.ReactNode[] = [];
    const boldRegex = /\*\*(.*?)\*\*/g;
    let lastIndex = 0;
    let match;
    let partKey = 0;

    while ((match = boldRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<span key={partKey++}>{text.slice(lastIndex, match.index)}</span>);
      }
      parts.push(<strong key={partKey++} className="font-bold">{match[1]}</strong>);
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(<span key={partKey++}>{text.slice(lastIndex)}</span>);
    }

    return parts.length > 0 ? parts : text;
  };

  const renderMarkdown = (text: string): React.ReactNode => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: string[] = [];
    let lineKey = 0;

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={lineKey++} className="list-disc list-inside space-y-1 my-2 mr-2">
            {listItems.map((item, i) => (
              <li key={i} className="text-sm">{renderInlineMarkdown(item)}</li>
            ))}
          </ul>
        );
        listItems = [];
      }
    };

    lines.forEach((line) => {
      const trimmedLine = line.trim();

      // Headers
      if (trimmedLine.startsWith('## ')) {
        flushList();
        elements.push(
          <h4 key={lineKey++} className="font-bold text-base mt-3 mb-2 flex items-center gap-2">
            {renderInlineMarkdown(trimmedLine.slice(3))}
          </h4>
        );
        return;
      }

      if (trimmedLine.startsWith('### ')) {
        flushList();
        elements.push(
          <h5 key={lineKey++} className="font-semibold text-sm mt-2 mb-1">
            {renderInlineMarkdown(trimmedLine.slice(4))}
          </h5>
        );
        return;
      }

      // List items (•, -, *)
      if (/^[•\-\*]\s/.test(trimmedLine)) {
        listItems.push(trimmedLine.slice(2));
        return;
      }

      // Empty line
      if (!trimmedLine) {
        flushList();
        return;
      }

      // Regular paragraph
      flushList();
      elements.push(
        <p key={lineKey++} className="text-sm mb-2 leading-relaxed">
          {renderInlineMarkdown(trimmedLine)}
        </p>
      );
    });

    flushList();
    return elements;
  };

  return (
    <div className="ai-message-content leading-relaxed">
      {parseContent(content)}
    </div>
  );
};

export default AIMessageRenderer;
