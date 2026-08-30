"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { AlertTriangle, Lock, LogIn, Mail, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { FormPasswordField, FormTextField } from "@/components/form";
import {
  adminLoginSchema,
  type AdminLoginSchemaValues,
} from "@/lib/validation";

const AdminLoginPage = () => {
  const { signIn, user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const isSessionExpired = searchParams.get("expired") === "true";

  const form = useForm<AdminLoginSchemaValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onBlur",
  });

  useEffect(() => {
    if (isSessionExpired) {
      window.history.replaceState({}, "", "/admin/login");
    }
  }, [isSessionExpired]);

  useEffect(() => {
    if (user) router.replace("/admin");
  }, [user, router]);

  const onSubmit = async (values: AdminLoginSchemaValues) => {
    const { error } = await signIn(values.email, values.password);
    if (error) {
      toast({
        title: "Login Failed",
        description: error,
        variant: "destructive",
      });
      return;
    }
    router.replace("/admin");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="border-border bg-card/95 shadow-2xl backdrop-blur-xl">
          <CardHeader className="pb-2 pt-8 text-center">
            <div className="hero-gradient mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl shadow-soft-md ring-4 ring-primary/10">
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
              Trialvo Shop
            </CardTitle>
            <CardDescription className="mt-1 text-muted-foreground">
              Sign in to the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-8">
            {isSessionExpired ? (
              <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <p className="text-sm font-medium">
                  Your session has expired. Please sign in again.
                </p>
              </div>
            ) : null}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
                noValidate
              >
                <FormTextField
                  control={form.control}
                  name="email"
                  type="email"
                  label="Email"
                  placeholder="admin@example.com"
                  autoComplete="username"
                  requiredMark
                  startAdornment={<Mail className="h-4 w-4" />}
                  inputClassName="rounded-xl bg-muted/30"
                />
                <FormPasswordField
                  control={form.control}
                  name="password"
                  label="Password"
                  placeholder="••••••••"
                  requiredMark
                  startAdornment={<Lock className="h-4 w-4" />}
                  inputClassName="rounded-xl bg-muted/30"
                />

                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="hero-gradient mt-2 h-11 w-full rounded-xl border-0 text-sm font-semibold text-white shadow-soft-md hover:opacity-90"
                >
                  {form.formState.isSubmitting ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign In
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-xs font-medium text-muted-foreground/50">
          © {new Date().getFullYear()} Trialvo Shop Admin
        </p>
      </motion.div>
    </div>
  );
};

export default AdminLoginPage;
