// Basic bad word filter - expandable list
const badWords = [
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "bastard",
  "damn",
  "crap",
  "piss",
  "dick",
  "cock",
  "pussy",
  "slut",
  "whore",
  // Add more as needed
];

export function containsBadWords(text: string): boolean {
  const lowerText = text.toLowerCase();
  return badWords.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(lowerText);
  });
}
