import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface BannerUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BannerUploadDialog({ open, onOpenChange }: BannerUploadDialogProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        
        const uploadRes = await fetch("/api/materials/upload", {
          method: "POST",
          body: formData,
        });
        
        if (!uploadRes.ok) throw new Error("Upload failed");
        const { url } = await uploadRes.json();
        return apiRequest("POST", "/api/banners", { imageUrl: url, order: 0 });
      } else if (imageUrl) {
        return apiRequest("POST", "/api/banners", { imageUrl, order: 0 });
      }
      throw new Error("No image provided");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banners"] });
      toast({ title: t("success"), description: "Banner uploaded successfully" });
      onOpenChange(false);
      setFile(null);
      setImageUrl("");
    },
    onError: (error: Error) => {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("uploadBanner")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file-upload">{t("uploadImage")}</Label>
            <Input
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0];
                if (selectedFile) {
                  setFile(selectedFile);
                  setImageUrl("");
                }
              }}
              data-testid="input-banner-file"
            />
          </div>
          <div className="relative flex items-center gap-3">
            <div className="flex-1 border-t border-border"></div>
            <span className="text-xs text-muted-foreground">OR</span>
            <div className="flex-1 border-t border-border"></div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="image-url">{t("imageUrl")}</Label>
            <Input
              id="image-url"
              type="url"
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                setFile(null);
              }}
              data-testid="input-banner-url"
            />
          </div>
          <Button
            onClick={() => uploadMutation.mutate()}
            disabled={uploadMutation.isPending || (!file && !imageUrl)}
            className="w-full"
            data-testid="button-upload-banner"
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploadMutation.isPending ? t("uploading") : t("upload")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
