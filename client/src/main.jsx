import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.jsx'

const sentryDsn = import.meta.env.VITE_SENTRY_DSN

Sentry.init({
  dsn: sentryDsn,
  enabled: Boolean(sentryDsn),
  environment: import.meta.env.MODE,
  sendDefaultPii: false,
  tracesSampleRate: 0.1,
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Sentry.ErrorBoundary
      fallback={({ resetError }) => (
        <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-center text-white">
          <section role="alert" className="max-w-lg space-y-4">
            <h1 className="text-2xl font-bold">Что-то пошло не так</h1>
            <p>Ошибка отправлена команде. Попробуйте перезагрузить страницу.</p>
            <button
              className="rounded-lg bg-fuchsia-600 px-4 py-2 font-semibold hover:bg-fuchsia-500"
              onClick={resetError}
              type="button"
            >
              Попробовать снова
            </button>
          </section>
        </main>
      )}
    >
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
