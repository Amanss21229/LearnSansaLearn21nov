import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Section } from "@shared/schema";

interface MaterialUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
}

export default function MaterialUploadDialog({ open, onOpenChange, subjectId }: MaterialUploadDialogProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"pdf" | "image" | "audio" | "video" | "youtube">("pdf");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [sectionId, setSectionId] = useState("");

  const { data: sections } = useQuery<Section[]>({
    queryKey: ["/api/sections", subjectId],
    enabled: open && !!subjectId,
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      let materialUrl = url;
      
      if (file && type !== "youtube") {
        const formData = new FormData();
        formData.append("file", file);
        
        const uploadRes = await fetch("/api/materials/upload", {
          method: "POST",
          body: formData,
        });
        
        if (!uploadRes.ok) throw new Error("Upload failed");
        const data = await uploadRes.json();
        materialUrl = data.url;
      }
      
      if (!materialUrl) throw new Error("No file or URL provided");
      if (!sectionId) throw new Error("Please select a section");
      
      return apiRequest("POST", "/api/materials", {
        sectionId,
        title,
        type,
        url: materialUrl,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      toast({ title: t("success"), description: "Material uploaded successfully" });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setTitle("");
    setType("pdf");
    setFile(null);
    setUrl("");
    setSectionId("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("uploadMaterial")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="material-title">{t("materialTitle")}</Label>
            <Input
              id="material-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("materialTitle")}
              data-testid="input-material-title"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="section-select">{t("selectSection")}</Label>
            <Select value={sectionId} onValueChange={setSectionId}>
              <SelectTrigger id="section-select" data-testid="select-material-section">
                <SelectValue placeholder={t("selectSection")} />
              </SelectTrigger>
              <SelectContent>
                {sections?.map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="material-type">{t("materialType")}</Label>
            <Select value={type} onValueChange={(val) => setType(val as typeof type)}>
              <SelectTrigger id="material-type" data-testid="select-material-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">{t("pdf")}</SelectItem>
                <SelectItem value="image">{t("image")}</SelectItem>
                <SelectItem value="audio">{t("audio")}</SelectItem>
                <SelectItem value="video">{t("video")}</SelectItem>
                <SelectItem value="youtube">{t("youtube")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {type === "youtube" ? (
            <div className="space-y-2">
              <Label htmlFor="youtube-url">{t("youtubeUrl")}</Label>
              <Input
                id="youtube-url"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                data-testid="input-youtube-url"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="file-upload">{t("uploadFile")}</Label>
              <Input
                id="file-upload"
                type="file"
                accept={
                  type === "pdf" ? ".pdf" :
                  type === "image" ? "image/*" :
                  type === "audio" ? "audio/*" :
                  "video/*"
                }
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0];
                  if (selectedFile) setFile(selectedFile);
                }}
                data-testid="input-material-file"
              />
            </div>
          )}
          
          <Button
            onClick={() => uploadMutation.mutate()}
            disabled={uploadMutation.isPending || !title.trim() || !sectionId || (!file && !url)}
            className="w-full"
            data-testid="button-upload-material"
          >
            {uploadMutation.isPending ? t("uploading") : t("upload")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
