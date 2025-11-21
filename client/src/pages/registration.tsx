import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useUser } from "@/contexts/UserContext";
import type { User as UserType } from "@shared/schema";

const registrationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  gender: z.string().min(1, "Gender is required"),
  stream: z.string().min(1, "Stream is required"),
  class: z.string().min(1, "Class is required"),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  profilePhoto: z.string().optional(),
  language: z.string().default("english"),
});

type RegistrationForm = z.infer<typeof registrationSchema>;

export default function Registration() {
  const { t, language } = useLanguage();
  const { setUser } = useUser();
  const { toast } = useToast();
  const [selectedStream, setSelectedStream] = useState<string>("");
  const [photoPreview, setPhotoPreview] = useState<string>("");

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      language: language,
    }
  });

  const stream = watch("stream");

  const createUserMutation = useMutation({
    mutationFn: async (data: RegistrationForm) => {
      return await apiRequest<UserType>("POST", "/api/users", data);
    },
    onSuccess: (user) => {
      setUser(user);
      toast({
        title: t("success"),
        description: "Account created successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: t("error"),
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegistrationForm) => {
    createUserMutation.mutate(data);
  };

  const getClassOptions = () => {
    if (stream === "School") {
      return ["5", "6", "7", "8", "9", "10", "11", "12"];
    } else if (stream === "NEET" || stream === "JEE") {
      return ["11", "12", "Dropper"];
    }
    return [];
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="font-heading text-3xl">{t("welcomeToSansaLearn")}</CardTitle>
          <CardDescription className="text-base">{t("createAccount")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="w-24 h-24">
                <AvatarImage src={photoPreview} />
                <AvatarFallback className="bg-primary/10">
                  <User className="w-12 h-12 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-center gap-2">
                <Label htmlFor="photo" className="text-sm font-medium">
                  {t("profilePhoto")} <span className="text-muted-foreground">({t("optional")})</span>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("photo")?.click()}
                  data-testid="button-upload-photo"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {t("uploadPhoto")}
                </Button>
                <input
                  id="photo"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("name")} *</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder={t("name")}
                  data-testid="input-name"
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">{t("username")} *</Label>
                <Input
                  id="username"
                  {...register("username")}
                  placeholder={t("username")}
                  data-testid="input-username"
                />
                {errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">{t("gender")} *</Label>
                <Select onValueChange={(value) => setValue("gender", value)}>
                  <SelectTrigger data-testid="select-gender">
                    <SelectValue placeholder={t("gender")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">{t("male")}</SelectItem>
                    <SelectItem value="Female">{t("female")}</SelectItem>
                    <SelectItem value="Other">{t("other")}</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && <p className="text-sm text-destructive">{errors.gender.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="stream">{t("stream")} *</Label>
                <Select onValueChange={(value) => {
                  setValue("stream", value);
                  setSelectedStream(value);
                  setValue("class", "");
                }}>
                  <SelectTrigger data-testid="select-stream">
                    <SelectValue placeholder={t("stream")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="School">{t("school")}</SelectItem>
                    <SelectItem value="NEET">{t("neet")}</SelectItem>
                    <SelectItem value="JEE">{t("jee")}</SelectItem>
                  </SelectContent>
                </Select>
                {errors.stream && <p className="text-sm text-destructive">{errors.stream.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="class">{t("selectClass")} *</Label>
                <Select onValueChange={(value) => setValue("class", value)} disabled={!stream}>
                  <SelectTrigger data-testid="select-class">
                    <SelectValue placeholder={t("selectClass")} />
                  </SelectTrigger>
                  <SelectContent>
                    {getClassOptions().map((cls) => (
                      <SelectItem key={cls} value={cls}>
                        {cls === "Dropper" ? t("dropper") : `${t("selectClass").split(" ")[0]} ${cls}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.class && <p className="text-sm text-destructive">{errors.class.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t("phone")}</Label>
                <Input
                  id="phone"
                  {...register("phone")}
                  placeholder={t("phone")}
                  data-testid="input-phone"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder={t("email")}
                  data-testid="input-email"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={createUserMutation.isPending}
              data-testid="button-register"
            >
              {createUserMutation.isPending ? t("loading") : t("register")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
