export const Logo = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 7L8 12L12 17L16 12L12 7Z" fill="currentColor" fillOpacity="0.2" />
    <path d="M9 2L2 12L9 22" />
    <path d="M15 2L22 12L15 22" />
    <path d="M12 2V5" />
    <path d="M12 19V22" />
  </svg>
);
