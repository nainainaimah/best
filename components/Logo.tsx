import Link from 'next/link';

interface LogoProps {
  locale?: string;
  className?: string;
  showText?: boolean;
  brandColor?: string;
}

export default function Logo({
  locale = 'en',
  className = '',
  showText = true,
  brandColor = '#6366F1'
}: LogoProps) {
  return (
    <Link href={`/${locale}/dashboard`} className={`flex items-center gap-2 ${className}`}>
      {/* Logo Icon */}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white text-xl shadow-md hover:shadow-lg transition-shadow"
        style={{ backgroundColor: brandColor }}
      >
        PM
      </div>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col">
          <span className="font-bold text-lg leading-tight" style={{ color: brandColor }}>
            PostMuse
          </span>
          <span className="text-xs text-gray-500 leading-tight">
            .ai
          </span>
        </div>
      )}
    </Link>
  );
}
