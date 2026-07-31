export function ProfileEmptyHint({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-white/10 py-10 text-netflix-muted">
      {icon}
      <p className="text-sm">{text}</p>
    </div>
  );
}
