import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, Plus, Trophy, CheckCircle, XCircle, MinusCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Test, Question, Submission, User as UserType } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function TestPage() {
  const { user } = useUser();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [currentSubmission, setCurrentSubmission] = useState<Submission | null>(null);

  const { data: tests } = useQuery<Test[]>({
    queryKey: ["/api/tests", user?.stream, user?.class],
    enabled: !!user,
  });

  const { data: questions } = useQuery<Question[]>({
    queryKey: ["/api/tests", selectedTest?.id, "questions"],
    enabled: !!selectedTest && !showResults,
  });

  const { data: leaderboard } = useQuery<Array<Submission & { user: UserType }>>({
    queryKey: ["/api/tests", selectedTest?.id, "leaderboard"],
    enabled: !!selectedTest && showResults,
  });

  const submitTestMutation = useMutation({
    mutationFn: async (data: { testId: string; answers: Record<string, string> }) => {
      return await apiRequest<Submission>("POST", `/api/tests/${data.testId}/submit`, { 
        answers: data.answers,
        userId: user?.id 
      });
    },
    onSuccess: (submission) => {
      setCurrentSubmission(submission);
      setShowResults(true);
      queryClient.invalidateQueries({ queryKey: ["/api/tests", selectedTest?.id, "leaderboard"] });
      toast({
        title: t("success"),
        description: "Test submitted successfully!",
      });
    },
  });

  const startTest = (test: Test) => {
    setSelectedTest(test);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setTimeLeft(test.duration * 60);
    setShowResults(false);
    setCurrentSubmission(null);
    
    // Start timer
    if (timerInterval) clearInterval(timerInterval);
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setTimerInterval(interval);
  };

  const handleSubmit = () => {
    if (selectedTest) {
      submitTestMutation.mutate({
        testId: selectedTest.id,
        answers,
      });
    }
  };

  const currentQuestion = questions?.[currentQuestionIndex];

  useEffect(() => {
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [timerInterval]);

  const getAnswerStatus = (questionId: string) => {
    if (!currentSubmission) return "unattempted";
    const userAnswer = answers[questionId];
    if (!userAnswer) return "unattempted";
    const question = questions?.find(q => q.id === questionId);
    if (question?.correctAnswer === userAnswer) return "correct";
    return "wrong";
  };

  if (showResults && currentSubmission) {
    return (
      <div className="h-full overflow-auto p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-2xl">{t("result")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-primary/10">
                  <div className="text-3xl font-bold text-primary">{currentSubmission.score}</div>
                  <div className="text-sm text-muted-foreground">{t("score")}</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-green-500/10">
                  <div className="text-3xl font-bold text-green-600">{currentSubmission.correctCount}</div>
                  <div className="text-sm text-muted-foreground">{t("correct")}</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-red-500/10">
                  <div className="text-3xl font-bold text-red-600">{currentSubmission.wrongCount}</div>
                  <div className="text-sm text-muted-foreground">{t("wrong")}</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted">
                  <div className="text-3xl font-bold">{currentSubmission.unattemptedCount}</div>
                  <div className="text-sm text-muted-foreground">{t("unattempted")}</div>
                </div>
              </div>

              <div className="text-center p-4 bg-accent rounded-lg">
                <div className="text-xl font-semibold">
                  {t("rank")}: #{currentSubmission.rank || "N/A"}
                </div>
              </div>

              <div>
                <h3 className="font-heading font-semibold text-lg mb-3">{t("leaderboard")}</h3>
                <div className="space-y-2">
                  {leaderboard?.slice(0, 10).map((entry, index) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-card hover-elevate"
                      data-testid={`leaderboard-entry-${index}`}
                    >
                      <div className="font-bold text-lg w-8">{index + 1}</div>
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={entry.user.profilePhoto} />
                        <AvatarFallback>{entry.user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-semibold">{entry.user.name}</div>
                        <div className="text-xs text-muted-foreground">@{entry.user.username}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg text-primary">{entry.score}</div>
                        <div className="text-xs text-muted-foreground">points</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-heading font-semibold text-lg mb-3">{t("detailedAnalysis")}</h3>
                <div className="space-y-2">
                  {questions?.map((question, index) => {
                    const status = getAnswerStatus(question.id);
                    const StatusIcon = status === "correct" ? CheckCircle : status === "wrong" ? XCircle : MinusCircle;
                    const statusColor = status === "correct" ? "text-green-600" : status === "wrong" ? "text-red-600" : "text-muted-foreground";
                    
                    return (
                      <div key={question.id} className="flex items-center gap-3 p-3 rounded-lg bg-card">
                        <StatusIcon className={`w-5 h-5 ${statusColor}`} />
                        <div className="flex-1">
                          <div className="font-medium">{t("question")} {index + 1}</div>
                          <div className="text-sm text-muted-foreground">
                            {status === "correct" ? t("correct") : status === "wrong" ? t("wrong") : t("unattempted")}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (selectedTest && questions) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b bg-card">
          <div>
            <h2 className="font-heading font-bold text-lg">{selectedTest.name}</h2>
            <p className="text-sm text-muted-foreground">
              {t("question")} {currentQuestionIndex + 1} / {questions.length}
            </p>
          </div>
          <div className="flex items-center gap-2 text-lg font-mono font-bold">
            <Clock className="w-5 h-5" />
            <span data-testid="text-timer">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                    {currentQuestionIndex + 1}
                  </div>
                  <CardTitle className="text-lg leading-relaxed">{currentQuestion?.questionText}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={answers[currentQuestion?.id || ""] || ""}
                  onValueChange={(value) => setAnswers({ ...answers, [currentQuestion?.id || ""]: value })}
                >
                  <div className="space-y-3">
                    {["A", "B", "C", "D"].map((option) => (
                      <div
                        key={option}
                        className={`flex items-center p-4 rounded-lg border-2 cursor-pointer hover-elevate ${
                          answers[currentQuestion?.id || ""] === option ? "border-primary bg-primary/5" : "border-border"
                        }`}
                      >
                        <RadioGroupItem value={option} id={`option-${option}`} className="mr-3" />
                        <Label htmlFor={`option-${option}`} className="flex-1 cursor-pointer">
                          {currentQuestion?.[`option${option}` as keyof Question]}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="p-4 border-t bg-card flex items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
            data-testid="button-previous"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {t("previous")}
          </Button>

          <div className="flex gap-2 overflow-auto">
            {questions.map((q, index) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-10 h-10 rounded flex items-center justify-center text-sm font-semibold ${
                  index === currentQuestionIndex
                    ? "bg-primary text-primary-foreground ring-2 ring-ring"
                    : answers[q.id]
                    ? "bg-accent text-accent-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
                data-testid={`button-question-${index}`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {currentQuestionIndex === questions.length - 1 ? (
            <Button onClick={handleSubmit} disabled={submitTestMutation.isPending} data-testid="button-submit-test">
              {t("submitTest")}
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
              data-testid="button-next"
            >
              {t("next")}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-heading font-bold text-2xl">{t("test")}</h1>
          {user?.isAdmin && (
            <Button data-testid="button-create-test">
              <Plus className="w-4 h-4 mr-2" />
              {t("createTest")}
            </Button>
          )}
        </div>

        <div className="grid gap-4">
          {tests?.map((test) => (
            <Card key={test.id} className="hover-elevate">
              <CardHeader>
                <CardTitle className="font-heading text-xl">{test.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    <Clock className="w-3 h-3 mr-1" />
                    {test.duration} min
                  </Badge>
                  <Badge variant="secondary">
                    {test.totalQuestions} questions
                  </Badge>
                  <Badge variant="outline">
                    {test.stream} - {test.class}
                  </Badge>
                </div>
                <Button onClick={() => startTest(test)} className="w-full" data-testid={`button-start-test-${test.id}`}>
                  {t("startTest")}
                </Button>
              </CardContent>
            </Card>
          ))}

          {(!tests || tests.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No tests available yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
