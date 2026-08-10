import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface Props {
  text: string;
  className?: string;
}

export function ChatMarkdown({ text, className }: Props) {
  return (
    <div
      className={cn(
        "space-y-2 text-sm leading-relaxed text-white",
        "[&_p]:leading-relaxed",
        "[&_a]:text-netflix-red [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-netflix-red-hover",
        "[&_strong]:font-semibold [&_strong]:text-white",
        "[&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5",
        "[&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5",
        "[&_li]:leading-relaxed",
        "[&_h1]:text-base [&_h1]:font-semibold [&_h1]:text-white",
        "[&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-white",
        "[&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-white",
        "[&_blockquote]:border-l-2 [&_blockquote]:border-netflix-red/60 [&_blockquote]:pl-3 [&_blockquote]:text-netflix-muted",
        "[&_code]:rounded [&_code]:bg-black/40 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[13px]",
        "[&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-black/40 [&_pre]:p-3 [&_pre]:text-[13px]",
        "[&_hr]:border-white/10",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  );
}
