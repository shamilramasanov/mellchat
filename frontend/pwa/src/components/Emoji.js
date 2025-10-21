import React from 'react';
import './Emoji.css';

const Emoji = ({ 
  type, 
  name, 
  url, 
  animated = false, 
  className = '', 
  title 
}) => {
  // Handle Unicode emojis (rendered by browser)
  if (type === 'unicode') {
    return (
      <span 
        className={`emoji emoji-unicode ${className}`}
        title={title || name}
        role="img"
        aria-label={name}
      >
        {name}
      </span>
    );
  }

  // Handle custom platform emojis (images)
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className={`emoji emoji-${type} ${animated ? 'emoji-animated' : ''} ${className}`}
        title={title || name}
        loading="lazy"
        onError={(e) => {
          // Fallback to text if image fails to load
          e.target.style.display = 'none';
          const fallback = document.createElement('span');
          fallback.className = `emoji emoji-fallback ${className}`;
          fallback.textContent = `:${name}:`;
          fallback.title = title || name;
          e.target.parentNode.insertBefore(fallback, e.target);
        }}
      />
    );
  }

  // Fallback for unknown emojis
  return (
    <span 
      className={`emoji emoji-unknown ${className}`}
      title={title || name}
    >
      :{name}:
    </span>
  );
};

// Component for rendering emoji text with mixed content
const EmojiText = ({ 
  text, 
  emojis = [], 
  className = '',
  platform = 'universal'
}) => {
  if (!emojis || emojis.length === 0) {
    return <span className={className}>{text}</span>;
  }

  // Sort emojis by position (ascending)
  const sortedEmojis = [...emojis].sort((a, b) => a.position - b.position);
  
  let result = [];
  let lastIndex = 0;

  sortedEmojis.forEach((emoji, index) => {
    // Add text before emoji
    if (emoji.position > lastIndex) {
      const textBefore = text.substring(lastIndex, emoji.position);
      if (textBefore) {
        result.push(
          <span key={`text-${index}`} className="emoji-text">
            {textBefore}
          </span>
        );
      }
    }

    // Add emoji
    result.push(
      <Emoji
        key={`emoji-${index}`}
        type={emoji.type}
        name={emoji.name}
        url={emoji.url}
        animated={emoji.animated}
        title={emoji.name}
        className="emoji-inline"
      />
    );

    lastIndex = emoji.position + emoji.length;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    if (remainingText) {
      result.push(
        <span key="text-end" className="emoji-text">
          {remainingText}
        </span>
      );
    }
  }

  return <span className={className}>{result}</span>;
};

// Hook for processing emojis
const useEmojiProcessor = () => {
  const processMessage = async (message, platform = 'universal') => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/v1/emoji/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          platform
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process emojis');
      }

      const data = await response.json();
      return data.message;
    } catch (error) {
      console.error('Error processing emojis:', error);
      return message; // Return original message if processing fails
    }
  };

  const parseEmojis = async (text, platform = 'universal') => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/v1/emoji/parse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          platform
        })
      });

      if (!response.ok) {
        throw new Error('Failed to parse emojis');
      }

      const data = await response.json();
      return data.emojis;
    } catch (error) {
      console.error('Error parsing emojis:', error);
      return [];
    }
  };

  return {
    processMessage,
    parseEmojis
  };
};

export default Emoji;
export { EmojiText, useEmojiProcessor };
