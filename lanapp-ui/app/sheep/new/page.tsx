import { DashboardLayout } from "@/components/dashboard-layout"
import { PageHeader } from "@/components/ui/page-header"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import { SheepForm } from "@/components/sheep-form"

export default function NewSheepPage() {
  return (
    <DashboardLayout>
      <Breadcrumb
        items={[
          { label: "Ovejas", href: "/sheep" },
          { label: "Nueva oveja" },
        ]}
      />
      <PageHeader title="Nueva oveja" description="Registra un nuevo animal en el rebaño" />
      <SheepForm mode="new" />
    </DashboardLayout>
  )
}
