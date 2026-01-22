import React from "react"
import { useFormContext, Controller } from "react-hook-form"

import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { UpdateSettingsInput } from "@shared/settings-schema"
import type { EnvSettingsValues } from "@client/pages/settings/types"

type EnvironmentSettingsSectionProps = {
  values: EnvSettingsValues
  isLoading: boolean
  isSaving: boolean
}

const formatSecretHint = (hint: string | null) => (hint ? `${hint}********` : "Not set")

export const EnvironmentSettingsSection: React.FC<EnvironmentSettingsSectionProps> = ({
  values,
  isLoading,
  isSaving,
}) => {
  const { register, control, formState: { errors } } = useFormContext<UpdateSettingsInput>()
  const { readable, private: privateValues } = values

  return (
    <AccordionItem value="environment" className="border rounded-lg px-4">
      <AccordionTrigger className="hover:no-underline py-4">
        <span className="text-base font-semibold">Environment</span>
      </AccordionTrigger>
      <AccordionContent className="pb-4">
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="text-sm font-medium">Readable values</div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="text-sm">RxResume email</div>
                <Input
                  {...register("rxresumeEmail")}
                  placeholder="you@example.com"
                  disabled={isLoading || isSaving}
                />
                {errors.rxresumeEmail && <p className="text-xs text-destructive">{errors.rxresumeEmail.message}</p>}
                <div className="text-xs text-muted-foreground">
                  Used for RxResume PDF automation.
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm">UKVisaJobs email</div>
                <Input
                  {...register("ukvisajobsEmail")}
                  placeholder="you@example.com"
                  disabled={isLoading || isSaving}
                />
                {errors.ukvisajobsEmail && <p className="text-xs text-destructive">{errors.ukvisajobsEmail.message}</p>}
                <div className="text-xs text-muted-foreground">
                  Used for refreshing UKVisaJobs sessions.
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm">Basic auth user</div>
                <Input
                  {...register("basicAuthUser")}
                  placeholder="username"
                  disabled={isLoading || isSaving}
                />
                {errors.basicAuthUser && <p className="text-xs text-destructive">{errors.basicAuthUser.message}</p>}
                <div className="text-xs text-muted-foreground">
                  Pair with a password to require auth on writes.
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm">Notion database ID</div>
                <Input
                  {...register("notionDatabaseId")}
                  placeholder="xxxxxxxxxxxxxxxxxxxx"
                  disabled={isLoading || isSaving}
                />
                {errors.notionDatabaseId && <p className="text-xs text-destructive">{errors.notionDatabaseId.message}</p>}
                <div className="text-xs text-muted-foreground">
                  Destination database for applied job entries.
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <div className="flex items-start space-x-3">
                  <Controller
                    name="ukvisajobsHeadless"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="ukvisajobsHeadless"
                        checked={field.value ?? readable.ukvisajobsHeadless}
                        onCheckedChange={(checked) => {
                          field.onChange(checked === "indeterminate" ? null : checked === true)
                        }}
                        disabled={isLoading || isSaving}
                      />
                    )}
                  />
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="ukvisajobsHeadless"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      UKVisaJobs headless mode
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Disable to show the browser while authenticating.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="text-sm font-medium">Private values</div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="text-sm">OpenRouter API key</div>
                <Input
                  {...register("openrouterApiKey")}
                  type="password"
                  placeholder="Enter new key"
                  disabled={isLoading || isSaving}
                />
                {errors.openrouterApiKey && <p className="text-xs text-destructive">{errors.openrouterApiKey.message}</p>}
                <div className="text-xs text-muted-foreground">
                  Current: <span className="font-mono">{formatSecretHint(privateValues.openrouterApiKeyHint)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm">RxResume password</div>
                <Input
                  {...register("rxresumePassword")}
                  type="password"
                  placeholder="Enter new password"
                  disabled={isLoading || isSaving}
                />
                {errors.rxresumePassword && <p className="text-xs text-destructive">{errors.rxresumePassword.message}</p>}
                <div className="text-xs text-muted-foreground">
                  Current: <span className="font-mono">{formatSecretHint(privateValues.rxresumePasswordHint)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm">UKVisaJobs password</div>
                <Input
                  {...register("ukvisajobsPassword")}
                  type="password"
                  placeholder="Enter new password"
                  disabled={isLoading || isSaving}
                />
                {errors.ukvisajobsPassword && <p className="text-xs text-destructive">{errors.ukvisajobsPassword.message}</p>}
                <div className="text-xs text-muted-foreground">
                  Current: <span className="font-mono">{formatSecretHint(privateValues.ukvisajobsPasswordHint)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm">Basic auth password</div>
                <Input
                  {...register("basicAuthPassword")}
                  type="password"
                  placeholder="Enter new password"
                  disabled={isLoading || isSaving}
                />
                {errors.basicAuthPassword && <p className="text-xs text-destructive">{errors.basicAuthPassword.message}</p>}
                <div className="text-xs text-muted-foreground">
                  Current: <span className="font-mono">{formatSecretHint(privateValues.basicAuthPasswordHint)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm">Webhook secret</div>
                <Input
                  {...register("webhookSecret")}
                  type="password"
                  placeholder="Enter new secret"
                  disabled={isLoading || isSaving}
                />
                {errors.webhookSecret && <p className="text-xs text-destructive">{errors.webhookSecret.message}</p>}
                <div className="text-xs text-muted-foreground">
                  Current: <span className="font-mono">{formatSecretHint(privateValues.webhookSecretHint)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm">Notion API key</div>
                <Input
                  {...register("notionApiKey")}
                  type="password"
                  placeholder="Enter new key"
                  disabled={isLoading || isSaving}
                />
                {errors.notionApiKey && <p className="text-xs text-destructive">{errors.notionApiKey.message}</p>}
                <div className="text-xs text-muted-foreground">
                  Current: <span className="font-mono">{formatSecretHint(privateValues.notionApiKeyHint)}</span>
                </div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Private values are write-only. Enter a new value to replace the stored secret.
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
