import { render, screen } from "@testing-library/react"
import { useForm, FormProvider } from "react-hook-form"

import { Accordion } from "@/components/ui/accordion"
import { EnvironmentSettingsSection } from "./EnvironmentSettingsSection"
import { UpdateSettingsInput } from "@shared/settings-schema"

const EnvironmentSettingsHarness = () => {
  const methods = useForm<UpdateSettingsInput>({
    defaultValues: {
      rxresumeEmail: "resume@example.com",
      ukvisajobsEmail: "visa@example.com",
      basicAuthUser: "admin",
      notionDatabaseId: "db-123",
      ukvisajobsHeadless: false,
      openrouterApiKey: "",
      rxresumePassword: "",
      ukvisajobsPassword: "",
      basicAuthPassword: "",
      webhookSecret: "",
      notionApiKey: "",
    }
  })

  return (
    <FormProvider {...methods}>
      <Accordion type="multiple" defaultValue={["environment"]}>
        <EnvironmentSettingsSection
          values={{
            readable: {
              rxresumeEmail: "resume@example.com",
              ukvisajobsEmail: "visa@example.com",
              basicAuthUser: "admin",
              notionDatabaseId: "db-123",
              ukvisajobsHeadless: false,
            },
            private: {
              openrouterApiKeyHint: "sk-1",
              rxresumePasswordHint: null,
              ukvisajobsPasswordHint: "pass",
              basicAuthPasswordHint: "abcd",
              webhookSecretHint: "sec-",
              notionApiKeyHint: "not-",
            },
          }}
          isLoading={false}
          isSaving={false}
        />
      </Accordion>
    </FormProvider>
  )
}

describe("EnvironmentSettingsSection", () => {
  it("renders readable values and masks private secrets with hints", () => {
    render(<EnvironmentSettingsHarness />)

    expect(screen.getByDisplayValue("resume@example.com")).toBeInTheDocument()
    expect(screen.getByDisplayValue("visa@example.com")).toBeInTheDocument()
    expect(screen.getByDisplayValue("admin")).toBeInTheDocument()
    expect(screen.getByDisplayValue("db-123")).toBeInTheDocument()

    expect(screen.getByText("sk-1********")).toBeInTheDocument()
    expect(screen.getByText("pass********")).toBeInTheDocument()
    expect(screen.getByText("abcd********")).toBeInTheDocument()
    expect(screen.getByText("sec-********")).toBeInTheDocument()
    expect(screen.getByText("not-********")).toBeInTheDocument()
    expect(screen.getByText("Not set")).toBeInTheDocument()

    const headlessToggle = screen.getByLabelText("UKVisaJobs headless mode")
    expect(headlessToggle).not.toBeChecked()
  })
})
