import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Smile } from "lucide-react";

const COMMON_EMOJIS = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣",
  "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰",
  "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜",
  "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏",
  "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣",
  "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠",
  "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨",
  "👍", "👎", "👏", "🙌", "🤝", "🙏", "💪", "❤️",
  "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎",
  "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💝",
  "🎉", "🎊", "🎈", "🎁", "🏆", "🥇", "🥈", "🥉",
  "⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏉", "🎱",
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  children?: React.ReactNode;
}

export default function EmojiPicker({ onSelect, children }: EmojiPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        {children || (
          <Button variant="outline" size="icon" data-testid="button-emoji-picker">
            <Smile className="w-5 h-5" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80" data-testid="popover-emoji-picker">
        <div className="grid grid-cols-8 gap-2">
          {COMMON_EMOJIS.map((emoji, index) => (
            <Button
              key={index}
              variant="ghost"
              className="h-10 w-10 p-0 text-xl hover-elevate active-elevate-2"
              onClick={() => onSelect(emoji)}
              data-testid={`emoji-${index}`}
            >
              {emoji}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
