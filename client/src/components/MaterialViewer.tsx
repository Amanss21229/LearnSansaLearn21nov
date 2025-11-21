import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Eye } from "lucide-react";
import type { Material } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useEffect } from "react";

interface MaterialViewerProps {
  material: Material | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MaterialViewer({ material, open, onOpenChange }: MaterialViewerProps) {
  const incrementViewMutation = useMutation({
    mutationFn: (materialId: string) => apiRequest("POST", `/api/materials/${materialId}/view`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
    },
  });

  useEffect(() => {
    if (open && material) {
      incrementViewMutation.mutate(material.id);
    }
  }, [open, material?.id]);

  if (!material) return null;

  const renderContent = () => {
    switch (material.type) {
      case "image":
        return (
          <div className="w-full flex items-center justify-center bg-muted/30 rounded-lg overflow-hidden">
            <img
              src={material.url}
              alt={material.title}
              className="max-w-full max-h-[70vh] object-contain"
            />
          </div>
        );

      case "pdf":
        return (
          <div className="w-full h-[70vh] bg-muted/30 rounded-lg overflow-hidden">
            <iframe
              src={material.url}
              className="w-full h-full"
              title={material.title}
            />
          </div>
        );

      case "video":
        return (
          <div className="w-full rounded-lg overflow-hidden bg-black">
            <video
              src={material.url}
              controls
              className="w-full max-h-[70vh]"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        );

      case "audio":
        return (
          <div className="w-full p-8 bg-muted/30 rounded-lg flex flex-col items-center justify-center space-y-4">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="w-12 h-12 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
              </svg>
            </div>
            <audio
              src={material.url}
              controls
              className="w-full max-w-md"
            >
              Your browser does not support the audio tag.
            </audio>
          </div>
        );

      case "youtube":
        const videoId = extractYouTubeId(material.url);
        if (videoId) {
          return (
            <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                title={material.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          );
        }
        return (
          <div className="w-full p-8 text-center">
            <p className="text-muted-foreground">Invalid YouTube URL</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.open(material.url, "_blank")}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in YouTube
            </Button>
          </div>
        );

      default:
        return (
          <div className="w-full p-8 text-center">
            <p className="text-muted-foreground">Preview not available for this file type</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.open(material.url, "_blank")}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in New Tab
            </Button>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-4 pr-8">
            <span className="truncate">{material.title}</span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant="secondary">{material.type.toUpperCase()}</Badge>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {material.viewCount}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          {renderContent()}
        </div>

        {material.type !== "youtube" && (
          <div className="flex justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => window.open(material.url, "_blank")}
              data-testid="button-open-external"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in New Tab
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}
