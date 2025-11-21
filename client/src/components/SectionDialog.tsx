import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";

interface SectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
}

export default function SectionDialog({ open, onOpenChange, subjectId }: SectionDialogProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [name, setName] = useState("");

  const createMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/sections", { subjectId, name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sections"] });
      toast({ title: t("success"), description: "Section created successfully" });
      onOpenChange(false);
      setName("");
    },
    onError: (error: Error) => {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("createSection")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="section-name">{t("sectionName")}</Label>
            <Input
              id="section-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("sectionName")}
              data-testid="input-section-name"
            />
          </div>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || !name.trim()}
            className="w-full"
            data-testid="button-create-section-submit"
          >
            {createMutation.isPending ? t("creating") : t("createSection")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
