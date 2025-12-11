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
  const { register: reg } = useContext(AuthContext);
  const { register, handleSubmit } = useForm();

  return (
    <form
      onSubmit={handleSubmit((data) => reg(data))}
      className="justify-center flex flex-col gap-8 items-center w-dvw h-dvh p-4"
    >
      <h1 className="text-4xl font-bold">JBlog</h1>
      <FieldGroup className="flex shadow-xl w-60">
        <FieldSet>
          <FieldContent>
            <FieldTitle className="text-xl font-black">Register</FieldTitle>
            <FieldDescription>Buat akun baru</FieldDescription>
          </FieldContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                {...register("email")}
                type="email"
                placeholder="apaaja@gmail.com"
                required
              />
            </Field>
          </FieldGroup>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">Name</FieldLabel>
              <Input
                {...register("name")}
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
            <Field>
              <FieldLabel htmlFor="password">Confirmation Password</FieldLabel>
              <Input
                {...register("confirmPassword")}
                type="password"
                placeholder="********"
                required
              />
            </Field>
          </FieldGroup>
          <FieldGroup>
            <Button type="submit">Register</Button>
            <Button>
              <Link href={"/login"}>Go to Login Page</Link>
            </Button>
          </FieldGroup>
        </FieldSet>
      </FieldGroup>
    </form>
  );
}
