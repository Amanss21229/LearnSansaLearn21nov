import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Bell, Search, Plus, BookOpen, FileText, GraduationCap, Beaker, Leaf, Bug, FileIcon, Image, Music, Video, Youtube, ExternalLink, Eye } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import { useLocation } from "wouter";
import type { Subject, Banner, Section, Material } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import SearchDialog from "@/components/SearchDialog";
import BannerUploadDialog from "@/components/BannerUploadDialog";
import SectionDialog from "@/components/SectionDialog";
import MaterialUploadDialog from "@/components/MaterialUploadDialog";
import SubjectDialog from "@/components/SubjectDialog";
import MaterialViewer from "@/components/MaterialViewer";

const subjectIcons = {
  Hindi: BookOpen,
  English: BookOpen,
  Mathematics: GraduationCap,
  Science: Beaker,
  "Social Studies": FileText,
  Physics: Beaker,
  Chemistry: Beaker,
  Botany: Leaf,
  Zoology: Bug,
};

export default function Home() {
  const { user } = useUser();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showBannerDialog, setShowBannerDialog] = useState(false);
  const [showSectionDialog, setShowSectionDialog] = useState(false);
  const [showMaterialDialog, setShowMaterialDialog] = useState(false);
  const [showSubjectDialog, setShowSubjectDialog] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [showMaterialViewer, setShowMaterialViewer] = useState(false);

  // Debug logging
  console.log("🔍 Home Page - User Data:", user);
  console.log("🔍 isAdmin:", user?.isAdmin);
  console.log("🔍 stream:", user?.stream);
  console.log("🔍 class:", user?.class);

  const { data: subjects, isLoading: subjectsLoading } = useQuery<Subject[]>({
    queryKey: ["/api/subjects", user?.stream, user?.class],
    queryFn: async () => {
      const response = await fetch(`/api/subjects?stream=${user?.stream}&class=${user?.class}`);
      if (!response.ok) throw new Error("Failed to fetch subjects");
      return response.json();
    },
    enabled: !!user?.stream && !!user?.class,
  });

  const { data: banners } = useQuery<Banner[]>({
    queryKey: ["/api/banners"],
  });

  const { data: sections } = useQuery<Section[]>({
    queryKey: ["/api/sections", selectedSubject?.id],
    queryFn: async () => {
      const response = await fetch(`/api/sections?subjectId=${selectedSubject?.id}`);
      if (!response.ok) throw new Error("Failed to fetch sections");
      return response.json();
    },
    enabled: !!selectedSubject,
  });

  const deleteBannerMutation = useMutation({
    mutationFn: (bannerId: string) => apiRequest("DELETE", `/api/banners/${bannerId}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banners"] });
      toast({ title: t("success"), description: t("bannerDeletedSuccessfully") });
    },
  });

  const getSubjectIcon = (name: string) => {
    const Icon = subjectIcons[name as keyof typeof subjectIcons] || BookOpen;
    return Icon;
  };

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case "pdf": return FileIcon;
      case "image": return Image;
      case "audio": return Music;
      case "video": return Video;
      case "youtube": return Youtube;
      default: return FileIcon;
    }
  };

  const useSectionMaterials = (sectionId: string) => {
    return useQuery<Material[]>({
      queryKey: ["/api/materials", sectionId],
      queryFn: async () => {
        const response = await fetch(`/api/materials?sectionId=${sectionId}`);
        if (!response.ok) throw new Error("Failed to fetch materials");
        return response.json();
      },
      enabled: !!sectionId,
    });
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-heading font-bold text-lg">S</span>
          </div>
          <div>
            <h1 className="font-heading font-bold text-xl">Sänsa Learn</h1>
            <p className="text-xs text-muted-foreground">{t("welcomeToSansaLearn")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setShowSearch(true)} data-testid="button-search">
            <Search className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setLocation("/announcements")} data-testid="button-notifications">
            <Bell className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <SearchDialog open={showSearch} onOpenChange={setShowSearch} userId={user?.id || ""} />
      <BannerUploadDialog open={showBannerDialog} onOpenChange={setShowBannerDialog} />
      <SubjectDialog open={showSubjectDialog} onOpenChange={setShowSubjectDialog} />
      <MaterialViewer material={selectedMaterial} open={showMaterialViewer} onOpenChange={setShowMaterialViewer} />
      {selectedSubject && (
        <>
          <SectionDialog open={showSectionDialog} onOpenChange={setShowSectionDialog} subjectId={selectedSubject.id} />
          <MaterialUploadDialog open={showMaterialDialog} onOpenChange={setShowMaterialDialog} subjectId={selectedSubject.id} />
        </>
      )}

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Featured Banners */}
          {banners && banners.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-semibold text-lg">{t("featuredBanners")}</h2>
                {user?.isAdmin && (
                  <Button size="sm" variant="outline" onClick={() => setShowBannerDialog(true)} data-testid="button-add-banner">
                    <Plus className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-4">
                  {banners.map((banner) => (
                    <div
                      key={banner.id}
                      className="relative h-48 w-80 flex-shrink-0 rounded-xl overflow-hidden hover-elevate group"
                    >
                      <img
                        src={banner.imageUrl}
                        alt="Banner"
                        className="w-full h-full object-cover"
                      />
                      {user?.isAdmin && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => deleteBannerMutation.mutate(banner.id)}
                          data-testid={`button-delete-banner-${banner.id}`}
                        >
                          {t("delete")}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          )}

          {/* Subjects */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-semibold text-lg">{t("subjects")}</h2>
              {user?.isAdmin && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setShowSubjectDialog(true)} 
                  data-testid="button-manage-subjects"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {subjects?.map((subject) => {
                const Icon = getSubjectIcon(subject.name);
                return (
                  <Dialog key={subject.id}>
                    <DialogTrigger asChild>
                      <Card
                        className="hover-elevate active-elevate-2 cursor-pointer transition-transform"
                        onClick={() => setSelectedSubject(subject)}
                        data-testid={`card-subject-${subject.id}`}
                      >
                        <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Icon className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-base">{subject.name}</h3>
                            <Badge variant="secondary" className="mt-1 text-xs">
                              {subject.class}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[80vh]">
                      <DialogHeader>
                        <DialogTitle className="font-heading text-2xl flex items-center gap-3">
                          <Icon className="w-8 h-8 text-primary" />
                          {subject.name}
                        </DialogTitle>
                      </DialogHeader>
                      <ScrollArea className="max-h-[60vh]">
                        <div className="space-y-4 pr-4">
                          {user?.isAdmin && (
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => setShowSectionDialog(true)} data-testid="button-create-section">
                                <Plus className="w-4 h-4 mr-2" />
                                {t("createSection")}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setShowMaterialDialog(true)} data-testid="button-upload-material">
                                <Plus className="w-4 h-4 mr-2" />
                                {t("uploadMaterial")}
                              </Button>
                            </div>
                          )}
                          {sections?.map((section) => {
                            const { data: sectionMaterials } = useSectionMaterials(section.id);
                            return (
                              <Card key={section.id}>
                                <CardHeader>
                                  <CardTitle className="text-lg">{section.name}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  {sectionMaterials && sectionMaterials.length > 0 ? (
                                    <div className="space-y-2">
                                      {sectionMaterials.map((material) => {
                                        const Icon = getMaterialIcon(material.type);
                                        return (
                                          <div
                                            key={material.id}
                                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover-elevate cursor-pointer"
                                            onClick={() => {
                                              setSelectedMaterial(material);
                                              setShowMaterialViewer(true);
                                            }}
                                            data-testid={`material-${material.id}`}
                                          >
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <Icon className="w-5 h-5 text-primary" />
                                              </div>
                                              <div className="min-w-0 flex-1">
                                                <h4 className="font-medium text-sm truncate">{material.title}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                  <Badge variant="secondary" className="text-xs">{material.type.toUpperCase()}</Badge>
                                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Eye className="w-3 h-3" />
                                                    {material.viewCount}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                            <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                      {t("noMaterialsYet")}
                                    </p>
                                  )}
                                </CardContent>
                              </Card>
                            );
                          })}
                          {(!sections || sections.length === 0) && (
                            <div className="text-center py-12 text-muted-foreground">
                              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                              <p>No content available yet</p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                );
              })}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
