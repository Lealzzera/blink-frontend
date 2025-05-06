import dynamic from "next/dynamic"


// Isso é necessário porque o FullCalendar depende de objetos do navegador (como `window`)
const Calendario = dynamic(() => import("@/components/calendario"), { ssr: false })

export default function CalendarPage() {
  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <Calendario />
    </div>
  )
}