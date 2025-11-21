import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Subject } from "@shared/schema";

interface SubjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SUBJECT_ICONS = [
  { value: "book", label: "Book" },
  { value: "calculator", label: "Calculator" },
  { value: "flask", label: "Flask" },
  { value: "globe", label: "Globe" },
  { value: "atom", label: "Atom" },
  { value: "leaf", label: "Leaf" },
  { value: "bug", label: "Bug" },
];

export default function SubjectDialog({ open, onOpenChange }: SubjectDialogProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [stream, setStream] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [icon, setIcon] = useState("book");

  const { data: allSubjects } = useQuery<Subject[]>({
    queryKey: ["/api/subjects/all"],
    queryFn: async () => {
      const streams = ["School", "NEET", "JEE"];
      const classes = ["5", "6", "7", "8", "9", "10", "11", "12"];
      const allSubjects: Subject[] = [];
      
      for (const s of streams) {
        for (const c of classes) {
          const response = await fetch(`/api/subjects?stream=${s}&class=${c}`);
          if (response.ok) {
            const data = await response.json();
            allSubjects.push(...data);
          }
        }
      }
      
      // Remove duplicates based on id
      const uniqueSubjects = Array.from(
        new Map(allSubjects.map(subject => [subject.id, subject])).values()
      );
      
      return uniqueSubjects;
    },
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/subjects", { name, stream, class: classLevel, icon }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subjects/all"] });
      toast({ title: t("success"), description: "Subject created successfully" });
      setName("");
      setStream("");
      setClassLevel("");
      setIcon("book");
    },
    onError: (error: Error) => {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (subjectId: string) => apiRequest("DELETE", `/api/subjects/${subjectId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subjects/all"] });
      toast({ title: t("success"), description: "Subject deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: t("error"), description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!name.trim() || !stream || !classLevel) {
      toast({ title: t("error"), description: "Please fill all fields", variant: "destructive" });
      return;
    }
    createMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading">Manage Subjects</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Create New Subject */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add New Subject
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subject-name">Subject Name</Label>
                  <Input
                    id="subject-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Physics"
                    data-testid="input-subject-name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subject-stream">Stream</Label>
                  <Select value={stream} onValueChange={setStream}>
                    <SelectTrigger id="subject-stream" data-testid="select-subject-stream">
                      <SelectValue placeholder="Select stream" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="School">School</SelectItem>
                      <SelectItem value="NEET">NEET</SelectItem>
                      <SelectItem value="JEE">JEE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subject-class">Class Range</Label>
                  <Input
                    id="subject-class"
                    value={classLevel}
                    onChange={(e) => setClassLevel(e.target.value)}
                    placeholder="e.g., 11-12 or 5-12"
                    data-testid="input-subject-class"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subject-icon">Icon</Label>
                  <Select value={icon} onValueChange={setIcon}>
                    <SelectTrigger id="subject-icon" data-testid="select-subject-icon">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECT_ICONS.map((iconOption) => (
                        <SelectItem key={iconOption.value} value={iconOption.value}>
                          {iconOption.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || !name.trim() || !stream || !classLevel}
                className="w-full"
                data-testid="button-create-subject"
              >
                {createMutation.isPending ? "Creating..." : "Create Subject"}
              </Button>
            </CardContent>
          </Card>
          
          {/* Existing Subjects */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Existing Subjects</h3>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {allSubjects && allSubjects.length > 0 ? (
                  allSubjects.map((subject) => (
                    <Card key={subject.id} className="hover-elevate">
                      <CardContent className="p-3 flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{subject.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {subject.stream} - Class {subject.class}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(subject.id)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-subject-${subject.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No subjects found
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
