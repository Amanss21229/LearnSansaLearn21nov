import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit2, LogOut, Camera, Globe } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const profileSchema = z.object({
  name: z.string().min(1),
  username: z.string().min(3),
  gender: z.string(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  profilePhoto: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function Profile() {
  const { user, setUser, logout } = useUser();
  const { t, language, setLanguage } = useLanguage();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(user?.profilePhoto || "");

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      username: user?.username || "",
      gender: user?.gender || "",
      phone: user?.phone || "",
      email: user?.email || "",
      profilePhoto: user?.profilePhoto || "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      return await apiRequest("PATCH", `/api/users/${user?.id}`, data);
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      setIsEditing(false);
      toast({
        title: t("success"),
        description: "Profile updated successfully!",
      });
    },
  });

  const onSubmit = (data: ProfileForm) => {
    updateProfileMutation.mutate(data);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPhotoPreview(base64);
        setValue("profilePhoto", base64);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!user) return null;

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="font-heading text-2xl">{t("profile")}</CardTitle>
              <div className="flex gap-2">
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    data-testid="button-edit-profile"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    {t("edit")}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  data-testid="button-logout"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {t("logout")}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={photoPreview} />
                    <AvatarFallback className="text-2xl">{user.name[0]}</AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="absolute bottom-0 right-0 rounded-full"
                      onClick={() => document.getElementById("profile-photo")?.click()}
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  )}
                  <input
                    id="profile-photo"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </div>
                <div className="text-center">
                  <h2 className="font-heading font-bold text-xl">{user.name}</h2>
                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("name")}</Label>
                  <Input
                    id="name"
                    {...register("name")}
                    disabled={!isEditing}
                    data-testid="input-name"
                  />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">{t("username")}</Label>
                  <Input
                    id="username"
                    {...register("username")}
                    disabled={!isEditing}
                    data-testid="input-username"
                  />
                  {errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>{t("gender")}</Label>
                  <Input value={user.gender} disabled />
                </div>

                <div className="space-y-2">
                  <Label>{t("stream")}</Label>
                  <Input value={user.stream} disabled />
                </div>

                <div className="space-y-2">
                  <Label>{t("selectClass")}</Label>
                  <Input value={user.class} disabled />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t("phone")}</Label>
                  <Input
                    id="phone"
                    {...register("phone")}
                    disabled={!isEditing}
                    data-testid="input-phone"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t("email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    disabled={!isEditing}
                    data-testid="input-email"
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("language")}</Label>
                  <Select value={language} onValueChange={(val) => setLanguage(val as "english" | "hindi")}>
                    <SelectTrigger data-testid="select-language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="hindi">हिंदी</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isEditing && (
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    data-testid="button-save"
                  >
                    {updateProfileMutation.isPending ? t("loading") : t("save")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    data-testid="button-cancel"
                  >
                    {t("cancel")}
                  </Button>
                </div>
              )}

              {user.isAdmin && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      {t("adminDashboard")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Admin for Class: <span className="font-semibold text-foreground">{user.adminClass}</span>
                    </p>
                  </CardContent>
                </Card>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
