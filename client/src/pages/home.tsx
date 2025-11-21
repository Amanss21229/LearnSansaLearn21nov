import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Bell, Search, Plus, BookOpen, FileText, GraduationCap, Beaker, Leaf, Bug } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import type { Subject, Banner, Section, Material } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

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
    enabled: !!selectedSubject,
  });

  const getSubjectIcon = (name: string) => {
    const Icon = subjectIcons[name as keyof typeof subjectIcons] || BookOpen;
    return Icon;
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
          <Button variant="ghost" size="icon" data-testid="button-search">
            <Search className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" data-testid="button-notifications">
            <Bell className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Featured Banners */}
          {banners && banners.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-semibold text-lg">{t("featuredBanners")}</h2>
                {user?.isAdmin && (
                  <Button size="sm" variant="outline" data-testid="button-add-banner">
                    <Plus className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-4">
                  {banners.map((banner) => (
                    <div
                      key={banner.id}
                      className="relative h-48 w-80 flex-shrink-0 rounded-xl overflow-hidden hover-elevate"
                    >
                      <img
                        src={banner.imageUrl}
                        alt="Banner"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          )}

          {/* Subjects */}
          <div className="space-y-3">
            <h2 className="font-heading font-semibold text-lg">{t("subjects")}</h2>
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
                              <Button size="sm" variant="outline" data-testid="button-create-section">
                                <Plus className="w-4 h-4 mr-2" />
                                {t("createSection")}
                              </Button>
                              <Button size="sm" variant="outline" data-testid="button-upload-material">
                                <Plus className="w-4 h-4 mr-2" />
                                {t("uploadMaterial")}
                              </Button>
                            </div>
                          )}
                          {sections?.map((section) => (
                            <Card key={section.id}>
                              <CardHeader>
                                <CardTitle className="text-lg">{section.name}</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p className="text-sm text-muted-foreground">
                                  {t("studyMaterials")}
                                </p>
                              </CardContent>
                            </Card>
                          ))}
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
