import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Users } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Group } from "@shared/schema";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export default function SearchDialog({ open, onOpenChange, userId }: SearchDialogProps) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");

  const { data: groups, isLoading } = useQuery<Group[]>({
    queryKey: ["/api/groups/my", userId],
    enabled: open,
  });

  const filteredGroups = groups?.filter(group => 
    group.name.toLowerCase().includes(query.toLowerCase()) ||
    group.username.toLowerCase().includes(query.toLowerCase())
  ) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            {t("search")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder={t("searchGroups")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            data-testid="input-search-groups"
            className="w-full"
          />
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>{t("loading")}</p>
                </div>
              ) : filteredGroups.length > 0 ? (
                filteredGroups.map((group) => (
                  <Card key={group.id} className="hover-elevate cursor-pointer" data-testid={`card-group-${group.id}`}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <Users className="w-6 h-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{group.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">@{group.username}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>{query ? t("noResults") : t("startSearching")}</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
