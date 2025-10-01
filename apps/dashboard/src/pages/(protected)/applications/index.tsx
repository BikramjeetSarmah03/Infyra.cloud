import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(protected)/applications/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/(protected)/applications/"!</div>
}
