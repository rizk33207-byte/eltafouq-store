"use client";
import Image from "next/image";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { AdminRole, Grade, Lang, Locale, Subject } from "@/lib/types";
import {
  formatPriceEGP,
  getGradeLabel,
  getLanguageLabel,
  getSubjectLabel,
} from "@/lib/utils";
import AdminShell from "./AdminShell";

interface AdminBookRow {
  id: string;
  title: string;
  grade: Grade;
  language: Lang;
  subject: Subject;
  price: number;
  description: string;
  image?: string | null;
  stock: number;
  featured: boolean;
  lowStock: boolean;
}

interface AdminBooksResponse {
  data: AdminBookRow[];
}

interface AdminUploadResponse {
  url?: string;
  error?: string;
  details?: unknown;
}

type BookFormMode = "create" | "edit";

interface BookFormState {
  id: string;
  title: string;
  grade: Grade;
  language: Lang;
  subject: Subject;
  price: string;
  description: string;
  image: string;
  stock: string;
  featured: boolean;
}

interface AdminMeResponse {
  data: {
    id: string;
    email: string;
    role: AdminRole;
  };
}

interface AdminBooksClientProps {
  locale: Locale;
}

const gradeOptions: Grade[] = ["g1", "g2", "g3"];
const languageOptions: Lang[] = ["ar", "en"];
const subjectOptions: Subject[] = ["bio", "phy", "chem"];

const defaultFormState: BookFormState = {
  id: "",
  title: "",
  grade: "g1",
  language: "ar",
  subject: "bio",
  price: "",
  description: "",
  image: "",
  stock: "100",
  featured: false,
};

class UploadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadRequestError";
  }
}

export default function AdminBooksClient({ locale }: AdminBooksClientProps) {
  const t = useTranslations("admin.books");
  const tActions = useTranslations("admin.actions");
  const [role, setRole] = useState<AdminRole | null>(null);
  const [search, setSearch] = useState("");
  const [grade, setGrade] = useState<"" | Grade>("");
  const [language, setLanguage] = useState<"" | Lang>("");
  const [subject, setSubject] = useState<"" | Subject>("");
  const [books, setBooks] = useState<AdminBookRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formMode, setFormMode] = useState<BookFormMode>("create");
  const [formState, setFormState] = useState<BookFormState>(defaultFormState);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingBookId, setDeletingBookId] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);

  const canCreateOrFullEdit = role === "SUPER_ADMIN" || role === "ADMIN";
  const canDelete = role === "SUPER_ADMIN";

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    if (search.trim()) {
      params.set("q", search.trim());
    }
    if (grade) {
      params.set("grade", grade);
    }
    if (language) {
      params.set("language", language);
    }
    if (subject) {
      params.set("subject", subject);
    }

    return params.toString();
  }, [grade, language, search, subject]);

  const loadBooks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/books?${queryString}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        setError(t("loadError"));
        return;
      }

      const payload = (await response.json()) as AdminBooksResponse;
      setBooks(payload.data);
    } catch {
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [queryString, t]);

  useEffect(() => {
    void loadBooks();
  }, [loadBooks]);

  useEffect(() => {
    const loadRole = async () => {
      try {
        const response = await fetch("/api/admin/auth/me", { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as AdminMeResponse;
        setRole(payload.data.role);
      } catch {
        setRole(null);
      }
    };

    void loadRole();
  }, []);

  useEffect(
    () => () => {
      if (selectedImagePreview) {
        URL.revokeObjectURL(selectedImagePreview);
      }
    },
    [selectedImagePreview],
  );

  useEffect(() => {
    if (!errorToast) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setErrorToast(null);
    }, 4500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [errorToast]);

  const resetForm = () => {
    setFormState(defaultFormState);
    setEditingBookId(null);
    setSelectedImageFile(null);

    if (selectedImagePreview) {
      URL.revokeObjectURL(selectedImagePreview);
    }
    setSelectedImagePreview(null);
  };

  const openCreateModal = () => {
    if (!canCreateOrFullEdit) {
      return;
    }

    resetForm();
    setFormMode("create");
    setShowModal(true);
  };

  const openEditModal = (book: AdminBookRow) => {
    setFormMode("edit");
    setEditingBookId(book.id);
    setFormState({
      id: book.id,
      title: book.title,
      grade: book.grade,
      language: book.language,
      subject: book.subject,
      price: String(book.price),
      description: book.description,
      image: book.image ?? "",
      stock: String(book.stock),
      featured: book.featured,
    });
    setSelectedImageFile(null);

    if (selectedImagePreview) {
      URL.revokeObjectURL(selectedImagePreview);
      setSelectedImagePreview(null);
    }

    setShowModal(true);
  };

  const closeModal = () => {
    if (submitting) {
      return;
    }

    setShowModal(false);
    resetForm();
  };

  const handleImageSelect = (file: File | null) => {
    setSelectedImageFile(file);

    if (selectedImagePreview) {
      URL.revokeObjectURL(selectedImagePreview);
      setSelectedImagePreview(null);
    }

    if (file) {
      setSelectedImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImageIfNeeded = async (): Promise<string | undefined> => {
    if (!selectedImageFile) {
      return undefined;
    }

    const body = new FormData();
    body.append("file", selectedImageFile);

    const response = await fetch("/api/admin/upload", {
      method: "POST",
      body,
      credentials: "include",
    });
    const payload = (await response.json().catch(() => null)) as
      | AdminUploadResponse
      | null;

    if (!response.ok || !payload?.url) {
      if (typeof payload?.details === "string" && payload.details.trim()) {
        throw new UploadRequestError(payload.details);
      }

      if (payload?.details && typeof payload.details === "object") {
        const details = payload.details as { message?: string; code?: string | number };

        if (typeof details.message === "string" && details.message.trim()) {
          throw new UploadRequestError(details.message);
        }

        if (details.code !== undefined) {
          throw new UploadRequestError(String(details.code));
        }
      }

      if (payload?.error) {
        throw new UploadRequestError(payload.error);
      }

      throw new UploadRequestError(t("saveError"));
    }

    return payload.url;
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    if (!Number.isInteger(Number(formState.stock)) || Number(formState.stock) < 0) {
      setError(t("validationError"));
      return;
    }

    if (
      canCreateOrFullEdit &&
      (!formState.title.trim() ||
        !formState.description.trim() ||
        !Number.isFinite(Number(formState.price)) ||
        Number(formState.price) < 0)
    ) {
      setError(t("validationError"));
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setToast(null);
      setErrorToast(null);

      const endpoint =
        formMode === "create"
          ? "/api/admin/books"
          : `/api/admin/books/${encodeURIComponent(editingBookId ?? "")}`;
      const method = formMode === "create" ? "POST" : "PATCH";

      let uploadedImage: string | undefined;
      if (canCreateOrFullEdit) {
        uploadedImage = await uploadImageIfNeeded();
      }

      const body =
        !canCreateOrFullEdit && formMode === "edit"
          ? { stock: Number(formState.stock) }
          : {
              ...(formMode === "create" && formState.id.trim() ? { id: formState.id.trim() } : {}),
              title: formState.title.trim(),
              grade: formState.grade,
              language: formState.language,
              subject: formState.subject,
              price: Number(formState.price),
              description: formState.description.trim(),
              image: uploadedImage ?? (formState.image.trim() || undefined),
              featured: formState.featured,
              stock: Number(formState.stock),
            };

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        const errorCode = payload?.error;

        if (errorCode === "BOOK_ID_EXISTS") {
          setError(t("idExists"));
        } else if (errorCode === "FORBIDDEN") {
          setError(t("forbidden"));
        } else {
          setError(t("saveError"));
        }
        setErrorToast(t("saveError"));
        return;
      }

      setToast(formMode === "create" ? t("created") : t("saved"));
      setShowModal(false);
      resetForm();
      await loadBooks();
    } catch (caughtError) {
      if (caughtError instanceof UploadRequestError) {
        setError(caughtError.message);
        setErrorToast(caughtError.message);
        return;
      }

      setError(t("saveError"));
      setErrorToast(t("saveError"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (book: AdminBookRow) => {
    if (!canDelete || deletingBookId) {
      return;
    }

    const confirmed = window.confirm(t("deleteConfirm", { title: book.title }));
    if (!confirmed) {
      return;
    }

    try {
      setDeletingBookId(book.id);
      setError(null);
      setToast(null);

      const response = await fetch(`/api/admin/books/${encodeURIComponent(book.id)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        if (payload?.error === "BOOK_IN_USE") {
          setError(t("deleteBlocked"));
        } else {
          setError(t("deleteError"));
        }
        return;
      }

      setToast(t("deleted"));
      await loadBooks();
    } catch {
      setError(t("deleteError"));
    } finally {
      setDeletingBookId(null);
    }
  };

  const imagePreview = selectedImagePreview ?? formState.image;
  const isEditorMode = role === "EDITOR";

  return (
    <AdminShell
      locale={locale}
      title={t("title")}
      description={t("description")}
    >
      <div className="glass-panel rounded-2xl p-4">
        <div className="grid gap-3 lg:grid-cols-[1.2fr_0.2fr_0.2fr_0.2fr_auto_auto]">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("filters.search")}
            className="focus-visible-ring min-h-11 rounded-xl border border-white/15 bg-white/8 px-4 text-sm text-ink placeholder:text-ink-soft/70"
          />

          <select
            value={grade}
            onChange={(event) => setGrade(event.target.value as "" | Grade)}
            className="focus-visible-ring min-h-11 rounded-xl border border-white/15 bg-white/8 px-3 text-sm text-ink"
          >
            <option value="">{t("filters.allGrades")}</option>
            {gradeOptions.map((value) => (
              <option key={value} value={value}>
                {getGradeLabel(value, locale)}
              </option>
            ))}
          </select>

          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value as "" | Lang)}
            className="focus-visible-ring min-h-11 rounded-xl border border-white/15 bg-white/8 px-3 text-sm text-ink"
          >
            <option value="">{t("filters.allLanguages")}</option>
            {languageOptions.map((value) => (
              <option key={value} value={value}>
                {getLanguageLabel(value, locale)}
              </option>
            ))}
          </select>

          <select
            value={subject}
            onChange={(event) => setSubject(event.target.value as "" | Subject)}
            className="focus-visible-ring min-h-11 rounded-xl border border-white/15 bg-white/8 px-3 text-sm text-ink"
          >
            <option value="">{t("filters.allSubjects")}</option>
            {subjectOptions.map((value) => (
              <option key={value} value={value}>
                {getSubjectLabel(value, locale)}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setGrade("");
              setLanguage("");
              setSubject("");
            }}
            className="focus-visible-ring rounded-xl border border-white/15 bg-white/8 px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:bg-white/14 hover:text-ink"
          >
            {tActions("reset")}
          </button>

          {canCreateOrFullEdit ? (
            <button
              type="button"
              onClick={openCreateModal}
              className="focus-visible-ring rounded-xl bg-linear-to-l from-brand to-brand-strong px-4 py-2 text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.02]"
            >
              {t("add")}
            </button>
          ) : (
            <div />
          )}
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-rose-300/35 bg-rose-500/12 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {errorToast ? (
        <div className="mt-4 rounded-xl border border-rose-300/35 bg-rose-500/16 px-4 py-3 text-sm text-rose-200 shadow-[0_0_16px_rgba(244,63,94,0.2)]">
          {errorToast}
        </div>
      ) : null}

      {toast ? (
        <div className="mt-4 rounded-xl border border-emerald-300/35 bg-emerald-500/12 px-4 py-3 text-sm text-emerald-200">
          {toast}
        </div>
      ) : null}

      <div className="glass-panel mt-4 overflow-x-auto rounded-2xl">
        <table className="w-full min-w-[1080px] text-start">
          <thead className="border-b border-white/10 text-xs text-ink-soft">
            <tr>
              <th className="px-4 py-3">{t("table.title")}</th>
              <th className="px-4 py-3">{t("table.grade")}</th>
              <th className="px-4 py-3">{t("table.language")}</th>
              <th className="px-4 py-3">{t("table.subject")}</th>
              <th className="px-4 py-3">{t("table.price")}</th>
              <th className="px-4 py-3">{t("table.featured")}</th>
              <th className="px-4 py-3">{t("table.stock")}</th>
              <th className="px-4 py-3">{t("table.actions")}</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-sm text-ink-soft" colSpan={8}>
                  {tActions("loading")}
                </td>
              </tr>
            ) : books.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-sm text-ink-soft" colSpan={8}>
                  {t("empty")}
                </td>
              </tr>
            ) : (
              books.map((book) => (
                <tr key={book.id} className="border-b border-white/8 text-sm text-ink">
                  <td className="px-4 py-3">
                    <p className="font-semibold">{book.title}</p>
                    <p className="mt-1 text-xs text-ink-soft">ID: {book.id}</p>
                  </td>
                  <td className="px-4 py-3">{getGradeLabel(book.grade, locale)}</td>
                  <td className="px-4 py-3">{getLanguageLabel(book.language, locale)}</td>
                  <td className="px-4 py-3">{getSubjectLabel(book.subject, locale)}</td>
                  <td className="px-4 py-3">{formatPriceEGP(book.price, locale)}</td>
                  <td className="px-4 py-3">
                    {book.featured ? tActions("yes") : tActions("no")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="inline-flex items-center gap-2">
                      <span>{book.stock}</span>
                      {book.lowStock ? (
                        <span className="rounded-full border border-rose-300/45 bg-rose-500/20 px-2 py-0.5 text-[11px] font-bold text-rose-200">
                          {t("lowStock")}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(book)}
                        className="focus-visible-ring rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-white/16"
                      >
                        {isEditorMode ? t("editStock") : tActions("edit")}
                      </button>
                      {canDelete ? (
                        <button
                          type="button"
                          onClick={() => void handleDelete(book)}
                          disabled={deletingBookId === book.id}
                          className="focus-visible-ring rounded-lg border border-rose-300/35 bg-rose-500/16 px-3 py-1.5 text-xs font-semibold text-rose-200 transition-colors hover:bg-rose-500/24 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingBookId === book.id
                            ? tActions("deleting")
                            : tActions("delete")}
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#040714]/75 backdrop-blur-sm"
            onClick={closeModal}
            aria-hidden="true"
          />

          <section
            className="glass-panel relative z-[81] w-full max-w-3xl rounded-3xl p-5 sm:p-6"
            role="dialog"
            aria-modal="true"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-ink">
                {formMode === "create"
                  ? t("modal.createTitle")
                  : t("modal.editTitle")}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="focus-visible-ring rounded-lg border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-semibold text-ink-soft transition-colors hover:bg-white/14 hover:text-ink"
              >
                {tActions("close")}
              </button>
            </div>

            <form onSubmit={handleSave} className="grid gap-4">
              {formMode === "create" && canCreateOrFullEdit ? (
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-ink-soft">
                    {t("form.id")}
                  </span>
                  <input
                    type="text"
                    value={formState.id}
                    onChange={(event) =>
                      setFormState((current) => ({ ...current, id: event.target.value }))
                    }
                    placeholder={t("form.idPlaceholder")}
                    className="focus-visible-ring min-h-11 w-full rounded-xl border border-white/15 bg-white/8 px-3 text-sm text-ink placeholder:text-ink-soft/70"
                  />
                </label>
              ) : null}

              {isEditorMode ? (
                <div className="grid gap-4">
                  <div className="rounded-xl border border-white/10 bg-white/6 p-3">
                    <p className="text-xs text-ink-soft">{t("form.title")}</p>
                    <p className="mt-1 text-sm font-semibold text-ink">{formState.title}</p>
                  </div>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-ink-soft">
                      {t("form.stock")}
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={formState.stock}
                      onChange={(event) =>
                        setFormState((current) => ({ ...current, stock: event.target.value }))
                      }
                      className="focus-visible-ring min-h-11 w-full rounded-xl border border-white/15 bg-white/8 px-3 text-sm text-ink"
                      required
                    />
                  </label>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className="mb-1 block text-xs font-semibold text-ink-soft">
                      {t("form.title")}
                    </span>
                    <input
                      type="text"
                      value={formState.title}
                      onChange={(event) =>
                        setFormState((current) => ({ ...current, title: event.target.value }))
                      }
                      className="focus-visible-ring min-h-11 w-full rounded-xl border border-white/15 bg-white/8 px-3 text-sm text-ink"
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-ink-soft">
                      {t("form.grade")}
                    </span>
                    <select
                      value={formState.grade}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          grade: event.target.value as Grade,
                        }))
                      }
                      className="focus-visible-ring min-h-11 w-full rounded-xl border border-white/15 bg-white/8 px-3 text-sm text-ink"
                    >
                      {gradeOptions.map((value) => (
                        <option key={value} value={value}>
                          {getGradeLabel(value, locale)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-ink-soft">
                      {t("form.language")}
                    </span>
                    <select
                      value={formState.language}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          language: event.target.value as Lang,
                        }))
                      }
                      className="focus-visible-ring min-h-11 w-full rounded-xl border border-white/15 bg-white/8 px-3 text-sm text-ink"
                    >
                      {languageOptions.map((value) => (
                        <option key={value} value={value}>
                          {getLanguageLabel(value, locale)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-ink-soft">
                      {t("form.subject")}
                    </span>
                    <select
                      value={formState.subject}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          subject: event.target.value as Subject,
                        }))
                      }
                      className="focus-visible-ring min-h-11 w-full rounded-xl border border-white/15 bg-white/8 px-3 text-sm text-ink"
                    >
                      {subjectOptions.map((value) => (
                        <option key={value} value={value}>
                          {getSubjectLabel(value, locale)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-ink-soft">
                      {t("form.price")}
                    </span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={formState.price}
                      onChange={(event) =>
                        setFormState((current) => ({ ...current, price: event.target.value }))
                      }
                      className="focus-visible-ring min-h-11 w-full rounded-xl border border-white/15 bg-white/8 px-3 text-sm text-ink"
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-ink-soft">
                      {t("form.stock")}
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={formState.stock}
                      onChange={(event) =>
                        setFormState((current) => ({ ...current, stock: event.target.value }))
                      }
                      className="focus-visible-ring min-h-11 w-full rounded-xl border border-white/15 bg-white/8 px-3 text-sm text-ink"
                      required
                    />
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="mb-1 block text-xs font-semibold text-ink-soft">
                      {t("form.imageFile")}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => handleImageSelect(event.target.files?.[0] ?? null)}
                      className="focus-visible-ring min-h-11 w-full rounded-xl border border-white/15 bg-white/8 px-3 py-2 text-sm text-ink file:me-3 file:rounded-lg file:border-0 file:bg-white/16 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-ink"
                    />
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="mb-1 block text-xs font-semibold text-ink-soft">
                      {t("form.image")}
                    </span>
                    <input
                      type="text"
                      value={formState.image}
                      onChange={(event) =>
                        setFormState((current) => ({ ...current, image: event.target.value }))
                      }
                      placeholder={t("form.imagePlaceholder")}
                      className="focus-visible-ring min-h-11 w-full rounded-xl border border-white/15 bg-white/8 px-3 text-sm text-ink"
                    />
                  </label>

                  {imagePreview ? (
                    <div className="sm:col-span-2">
                      <p className="mb-1 text-xs font-semibold text-ink-soft">
                        {t("form.preview")}
                      </p>
                      <div className="relative h-40 w-32 overflow-hidden rounded-xl border border-white/15">
                        <Image
                          src={imagePreview}
                          alt={formState.title || "Book preview"}
                          fill
                          sizes="128px"
                          unoptimized={imagePreview.startsWith("blob:")}
                          className="object-cover"
                        />
                      </div>
                    </div>
                  ) : null}

                  <label className="block sm:col-span-2">
                    <span className="mb-1 block text-xs font-semibold text-ink-soft">
                      {t("form.description")}
                    </span>
                    <textarea
                      value={formState.description}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                      rows={4}
                      className="focus-visible-ring w-full rounded-xl border border-white/15 bg-white/8 px-3 py-2.5 text-sm text-ink"
                      required
                    />
                  </label>

                  <label className="inline-flex items-center gap-2 text-sm text-ink-soft sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={formState.featured}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          featured: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-white/20 bg-white/8 text-cyan-300"
                    />
                    {t("form.featured")}
                  </label>
                </div>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="focus-visible-ring rounded-xl bg-linear-to-l from-brand to-brand-strong px-4 py-2.5 text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? tActions("saving") : tActions("save")}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="focus-visible-ring rounded-xl border border-white/15 bg-white/8 px-4 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:bg-white/14 hover:text-ink"
                >
                  {tActions("cancel")}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </AdminShell>
  );
}
