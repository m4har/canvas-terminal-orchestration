import { isValidElement, type ReactElement, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MermaidDiagram } from "./MermaidDiagram";

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

function getCodeChild(children: ReactNode): ReactElement<{ className?: string; children?: ReactNode }> | null {
  if (!isValidElement(children)) return null;
  return children as ReactElement<{ className?: string; children?: ReactNode }>;
}

function isMermaidFence(className?: string) {
  return className?.split(" ").includes("language-mermaid");
}

export function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  return (
    <div className={`markdown-preview ${className ?? ""}`.trim()}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre({ children }) {
            const child = getCodeChild(children);
            if (child && isMermaidFence(child.props.className)) {
              const code = String(child.props.children ?? "").trim();
              return <MermaidDiagram code={code} />;
            }
            return <pre>{children}</pre>;
          },
          code({ className, children, ...props }) {
            if (isMermaidFence(className)) {
              return <code className={className} {...props}>{children}</code>;
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
