"use client"

import { useCallback, useEffect, useState } from "react"
import type { FormEvent } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/components/AuthProvider"
import {
  DESCRIPTION_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  TITLE_MIN_LENGTH,
  createHeist,
  getAssignableUsers,
  getHeistErrorMessage,
} from "@/lib/heists"
import type { User } from "@/types/firestore"
import styles from "./HeistForm.module.css"

type FieldErrors = {
  title?: string
  description?: string
  assignedTo?: string
}

type UsersState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; users: User[] }

export default function HeistForm() {
  const { user } = useUser()
  const router = useRouter()
  const uid = user?.uid
  const [usersState, setUsersState] = useState<UsersState>({
    status: "loading",
  })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState("")
  const [pending, setPending] = useState(false)

  // loaded once; a live listener is overkill for a form
  const loadUsers = useCallback(async () => {
    if (!uid) return
    setUsersState({ status: "loading" })
    try {
      setUsersState({ status: "ready", users: await getAssignableUsers(uid) })
    } catch {
      setUsersState({ status: "error" })
    }
  }, [uid])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUsers()
  }, [loadUsers])

  const users = usersState.status === "ready" ? usersState.users : []
  const nobodyToAssign = usersState.status === "ready" && users.length === 0

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const title = String(data.get("title") ?? "").trim()
    const description = String(data.get("description") ?? "").trim()
    const assignedTo = String(data.get("assignedTo") ?? "")
    const assignee = users.find((candidate) => candidate.id === assignedTo)

    const errors: FieldErrors = {}
    if (title.length < TITLE_MIN_LENGTH || title.length > TITLE_MAX_LENGTH) {
      errors.title = `Title must be ${TITLE_MIN_LENGTH} to ${TITLE_MAX_LENGTH} characters`
    }
    if (!description || description.length > DESCRIPTION_MAX_LENGTH) {
      errors.description = `Description is required, up to ${DESCRIPTION_MAX_LENGTH} characters`
    }
    if (!assignee) {
      errors.assignedTo = "Choose who to assign this heist to"
    }

    setFieldErrors(errors)
    setFormError("")
    if (Object.keys(errors).length > 0 || !assignee) return

    if (!user?.displayName) {
      setFormError("Your profile is still loading, try again in a moment")
      return
    }

    setPending(true)
    try {
      await createHeist(
        {
          title,
          description,
          assignedTo: assignee.id,
          assignedToCodename: assignee.codename,
        },
        { uid: user.uid, codename: user.displayName },
      )
      router.push("/heists")
    } catch (error) {
      setFormError(getHeistErrorMessage(error))
      setPending(false)
    }
  }

  return (
    <div className={styles.heistForm}>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label htmlFor="heist-title">Title</label>
          <input
            id="heist-title"
            name="title"
            type="text"
            maxLength={TITLE_MAX_LENGTH}
            aria-invalid={fieldErrors.title ? true : undefined}
            aria-describedby={fieldErrors.title ? "heist-title-error" : undefined}
          />
          {fieldErrors.title && (
            <p id="heist-title-error" role="alert" className={styles.error}>
              {fieldErrors.title}
            </p>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="heist-description">Description</label>
          <textarea
            id="heist-description"
            name="description"
            rows={4}
            maxLength={DESCRIPTION_MAX_LENGTH}
            aria-invalid={fieldErrors.description ? true : undefined}
            aria-describedby={
              fieldErrors.description ? "heist-description-error" : undefined
            }
          />
          {fieldErrors.description && (
            <p
              id="heist-description-error"
              role="alert"
              className={styles.error}
            >
              {fieldErrors.description}
            </p>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="heist-assignee">Assign to</label>
          <select
            id="heist-assignee"
            name="assignedTo"
            defaultValue=""
            disabled={usersState.status !== "ready" || nobodyToAssign}
            aria-invalid={fieldErrors.assignedTo ? true : undefined}
            aria-describedby={
              fieldErrors.assignedTo ? "heist-assignee-error" : undefined
            }
          >
            <option value="">
              {usersState.status === "loading"
                ? "Loading crew…"
                : "Choose a crew member"}
            </option>
            {users.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.codename}
              </option>
            ))}
          </select>
          {fieldErrors.assignedTo && (
            <p id="heist-assignee-error" role="alert" className={styles.error}>
              {fieldErrors.assignedTo}
            </p>
          )}
          {usersState.status === "error" && (
            <div role="alert" className={styles.error}>
              <p>We couldn&apos;t load your crew.</p>
              <button
                type="button"
                className={styles.retry}
                onClick={loadUsers}
              >
                Try again
              </button>
            </div>
          )}
          {nobodyToAssign && (
            <p>No one else has joined yet, invite a coworker first.</p>
          )}
        </div>

        {formError && (
          <p role="alert" className={styles.error}>
            {formError}
          </p>
        )}

        <button
          type="submit"
          className="btn"
          disabled={pending || usersState.status !== "ready" || nobodyToAssign}
        >
          {pending ? "Creating heist…" : "Create heist"}
        </button>
      </form>
    </div>
  )
}
