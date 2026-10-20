import { Smartphone } from 'lucide-react'
import { PageHeader, Card, CardHeader } from '../components/ui'
import { InstallGuide } from '../components/AppBanners'

export default function Install() {
  return (
    <div className="max-w-2xl">
      <PageHeader eyebrow="Application" title="Installer FORGE" subtitle="Ajoute FORGE à ton écran d’accueil : elle s’ouvre en plein écran comme une vraie app et fonctionne sans réseau." />
      <Card className="p-5 sm:p-6">
        <CardHeader icon={Smartphone} title="Installation pas à pas" />
        <InstallGuide />
      </Card>
    </div>
  )
}
