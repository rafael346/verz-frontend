"use client";

import { useEffect, useRef, useState } from "react";

import { ApiError } from "@/lib/api";

type Errors = { general: string | null; fields: Record<string, string> };

/**
 * Erros de um formulário: por campo (ligados ao input) e um aviso geral só quando o erro não pertence a um campo.
 * Depois de cada falha, o foco vai para o primeiro campo com erro — ou para o aviso, se não houver campo.
 */
export function useFormErrors() {
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Errors>({ general: null, fields: {} });

  useEffect(() => {
    const form = formRef.current;
    if (!form || (!errors.general && !Object.keys(errors.fields).length)) return;
    (form.querySelector<HTMLElement>('[aria-invalid="true"]') ?? form.querySelector<HTMLElement>('[role="alert"]'))?.focus();
  }, [errors]);

  return {
    formRef,
    ...errors,
    clear: () => setErrors({ general: null, fields: {} }),
    showFields: (fields: Record<string, string>) => setErrors({ general: null, fields }),
    fail: (failure: unknown) => {
      const apiError = failure instanceof ApiError ? failure : new ApiError(0, null);
      const fields = apiError.fieldErrors();
      const belongsToFields = Object.keys(fields).length > 0 && !apiError.body?.non_field_errors;
      setErrors({ general: belongsToFields ? null : apiError.message, fields });
    },
  };
}
