import React, { useEffect, useRef } from 'react';
import katex from 'katex';

interface KatexRendererProps {
  latex: string;
  inline?: boolean;
  className?: string;
}

const KatexRenderer: React.FC<KatexRendererProps> = ({ latex, inline = false, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentContainer = containerRef.current;
    if (!currentContainer) return;

    if (!latex || typeof latex !== 'string' || latex.trim() === '') {
      currentContainer.innerHTML = '<span style="color: #888; font-style: italic;">[Formula Kosong]</span>';
      return;
    }

    try {
      const html = katex.renderToString(latex, {
        displayMode: !inline,
        throwOnError: false, // KaTeX will render an error message in place of the math
        output: 'html', // Using 'html' instead of 'htmlAndMathml' for simplicity unless MathML is strictly needed
        macros: {
          "\\RR": "\\mathbb{R}", // Example custom macro
        },
        // Consider adding a trust setting if you use macros that can inject arbitrary HTML/CSS
        // trust: (context) => context.command === '\\htmlClass',
      });
      currentContainer.innerHTML = html;
    } catch (e: any) {
      console.error('KaTeX rendering error:', e);
      // Display the raw LaTeX and the error message for easier debugging
      currentContainer.innerHTML = `<span style="color: red; font-weight: bold;">Error:</span> ${e.message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}<br><span style="color: #555; font-style: italic;">Input: ${latex.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>`;
    }
  }, [latex, inline]);

  const containerStyles: React.CSSProperties = {
    minHeight: '24px',
    padding: '4px',
    fontSize: 'inherit',
    color: 'inherit', // Inherit color from parent, can be overridden by modal styles
  };
  
  // Apply a specific style for preview inside dark modals
  const previewSpecificStyles: React.CSSProperties = {
    backgroundColor: '#333', // Dark background for the preview area
    color: 'white', // White text for readability on dark background
    border: '1px dashed #777',
    borderRadius: '4px',
    colorScheme: 'dark', // Hint to browser for dark mode styling if applicable
  };

  return (
    <div 
      ref={containerRef} 
      className={`${className} ${inline ? 'math-formula-inline' : 'math-formula-block katex-preview-container'}`} 
      style={{...containerStyles, ...(className.includes('katex-renderer-preview') ? previewSpecificStyles : {}) }}
    />
  );
};

export default KatexRenderer;