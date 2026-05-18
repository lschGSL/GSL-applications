import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function ProcedureMarkdown({ content }: { content: string }) {
  return (
    <div className="max-w-none text-foreground leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (props) => (
            <h1 className="mt-8 mb-4 text-2xl font-bold tracking-tight" {...props} />
          ),
          h2: (props) => (
            <h2 className="mt-8 mb-3 text-xl font-semibold tracking-tight" {...props} />
          ),
          h3: (props) => (
            <h3 className="mt-6 mb-2 text-lg font-semibold" {...props} />
          ),
          h4: (props) => (
            <h4 className="mt-4 mb-2 text-base font-semibold" {...props} />
          ),
          p: (props) => <p className="my-3 leading-7" {...props} />,
          ul: (props) => (
            <ul className="my-3 list-disc space-y-1 pl-6" {...props} />
          ),
          ol: (props) => (
            <ol className="my-3 list-decimal space-y-1 pl-6" {...props} />
          ),
          li: (props) => <li className="leading-7" {...props} />,
          a: (props) => (
            <a
              className="text-[#67b9e8] underline-offset-2 hover:underline"
              target={props.href?.startsWith("http") ? "_blank" : undefined}
              rel={props.href?.startsWith("http") ? "noopener noreferrer" : undefined}
              {...props}
            />
          ),
          strong: (props) => <strong className="font-semibold" {...props} />,
          em: (props) => <em className="italic" {...props} />,
          blockquote: (props) => (
            <blockquote
              className="my-4 border-l-4 border-[#67b9e8]/40 bg-muted/40 px-4 py-2 italic text-muted-foreground"
              {...props}
            />
          ),
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code
                  className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          pre: (props) => (
            <pre
              className="my-4 overflow-x-auto rounded-md border bg-muted/60 p-4 font-mono text-sm"
              {...props}
            />
          ),
          hr: () => <hr className="my-8 border-border" />,
          table: (props) => (
            <div className="my-4 overflow-x-auto">
              <table className="w-full border-collapse text-sm" {...props} />
            </div>
          ),
          thead: (props) => <thead className="bg-muted/60" {...props} />,
          th: (props) => (
            <th
              className="border border-border px-3 py-2 text-left font-semibold"
              {...props}
            />
          ),
          td: (props) => (
            <td className="border border-border px-3 py-2 align-top" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
