import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Welcome to mybias-web
        </h1>
        <p className="text-muted-foreground">
          Built with React 19, TanStack Router, TanStack Query, and Tailwind CSS
        </p>
      </div>
    </div>
  )
}
