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

export default function Page() {
  const { login } = useContext(AuthContext);
  const { register, handleSubmit } = useForm();

  return (
    <form
      onSubmit={handleSubmit((data) => login(data))}
      className="justify-center flex items-center w-dvw h-dvh"
    >
      <FieldGroup className="flex justify-center items-center">
        <FieldSet>
          <FieldContent>
            <FieldTitle className="text-3xl font-black">Login</FieldTitle>
            <FieldDescription>
              Login untuk bisa like dan comment di postingan.
            </FieldDescription>
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
            <Button type="submit">Login</Button>
          </FieldGroup>
        </FieldSet>
      </FieldGroup>
    </form>
  );
}
