"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AuthContext } from "@/providers/AuthProvider";
import AxiosInstance from "@/utils/api";
import { AxiosError } from "axios";
import { useParams, useRouter } from "next/navigation";
import { useContext, useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

export default function Page() {
  const { verifyEmail } = useContext(AuthContext);
  const { userId } = useParams();
  const { register, handleSubmit } = useForm();

  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const response = await AxiosInstance.post("/email/check-verify", {
          userId,
        });
      } catch (error) {
        if (error instanceof AxiosError) {
          toast.error(error.response?.data.msg);
          router.push("/register");
        }
      }
    })();
  }, []);

  return (
    <Card className="max-w-sm w-full flex">
      <CardHeader>
        <CardTitle>Verifikasi Email</CardTitle>
        <CardDescription>
          Buka email kamu dan masukan kode verfikasi
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(verifyEmail)}>
          <FieldGroup>
            <FieldSet>
              <Field>
                <Input
                  {...register("code")}
                  className="h-20 text-5xl font-bold text-center"
                  type="text"
                  placeholder="Code"
                />
              </Field>
              <FieldGroup>
                <Field>
                  <Button type="submit">Verify</Button>
                  <Button>Resend Code</Button>
                </Field>
              </FieldGroup>
            </FieldSet>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
