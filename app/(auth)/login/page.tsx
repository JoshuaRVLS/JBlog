"use client";

import { AuthContext } from "@/providers/AuthProvider";
import AxiosInstance from "@/utils/api";
import axios from "axios";
import React, { FormEvent, useContext, useState } from "react";
import { FieldValues, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function Page() {
  const { login } = useContext(AuthContext);
  const { register, handleSubmit } = useForm();

  return (
    <form
      onSubmit={handleSubmit((data) => login(data))}
      className="justify-center flex flex-col gap-8 items-center w-dvw h-dvh p-4"
    >
      <h1 className="text-4xl font-bold">JBlog</h1>
      <FieldGroup className="flex justify-center items-center shadow-xl ">
        <FieldSet>
          <FieldContent>
            <FieldTitle className="text-xl font-black">Login</FieldTitle>
            <FieldDescription>
              Login untuk bisa like dan comment di postingan.
            </FieldDescription>
          </FieldContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                {...register("email")}
                type="text"
                placeholder="apaaja@gmail.com"
                required
              />
            </Field>
          </FieldGroup>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                {...register("password")}
                type="password"
                placeholder="********"
                required
              />
            </Field>
          </FieldGroup>
          <FieldGroup>
            <div className="flex items-center justify-between w-full">
              <Link
                href="/forgot-password"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          </FieldGroup>
          <FieldGroup>
            <Button type="submit">Login</Button>
          </FieldGroup>
          <FieldGroup>
            <Button>
              <Link href={"/register"}>Daftar akun baru</Link>
            </Button>
          </FieldGroup>
        </FieldSet>
      </FieldGroup>
    </form>
  );
}
