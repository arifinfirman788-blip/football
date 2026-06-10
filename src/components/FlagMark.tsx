import React from 'react';

const isFlagImageUrl = (value: string) => /^https?:\/\//i.test(value) || value.startsWith('data:image/');

interface FlagMarkProps {
  flag: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  emojiClassName?: string;
}

export const FlagMark: React.FC<FlagMarkProps> = ({
  flag,
  alt,
  className,
  imageClassName,
  emojiClassName,
}) => {
  if (isFlagImageUrl(flag)) {
    return (
      <span className={className}>
        <img
          src={flag}
          alt={alt}
          className={imageClassName || 'h-6 w-6 rounded-full object-cover'}
        />
      </span>
    );
  }

  return <span className={emojiClassName || className}>{flag}</span>;
};
